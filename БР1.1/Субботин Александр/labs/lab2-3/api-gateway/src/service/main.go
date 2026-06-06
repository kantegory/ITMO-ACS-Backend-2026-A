package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"

	"github.com/ZZISST/rental-api-gateway/internal/config"
	gatewaydocs "github.com/ZZISST/rental-api-gateway/internal/docs"
	bookingpb "github.com/ZZISST/rental-api-gateway/internal/pb/bookingpb"
	propertypb "github.com/ZZISST/rental-api-gateway/internal/pb/propertypb"
)

func grpcStatusToHTTP(code codes.Code) int {
	switch code {
	case codes.InvalidArgument:
		return http.StatusBadRequest
	case codes.Unauthenticated:
		return http.StatusUnauthorized
	case codes.PermissionDenied:
		return http.StatusForbidden
	case codes.NotFound:
		return http.StatusNotFound
	case codes.AlreadyExists:
		return http.StatusConflict
	case codes.FailedPrecondition:
		return http.StatusUnprocessableEntity
	case codes.Unavailable:
		return http.StatusServiceUnavailable
	case codes.Unimplemented:
		return http.StatusNotImplemented
	default:
		return http.StatusInternalServerError
	}
}

func gatewayErrorHandler(_ context.Context, _ *runtime.ServeMux, _ runtime.Marshaler, w http.ResponseWriter, _ *http.Request, err error) {
	st := status.Convert(err)
	code := st.Code()
	if code == codes.OK {
		code = codes.Internal
	}
	codeHTTP := grpcStatusToHTTP(code)
	msg := st.Message()
	if msg == "" {
		msg = http.StatusText(codeHTTP)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(codeHTTP)
	_ = json.NewEncoder(w).Encode(gin.H{"code": codeHTTP, "message": msg})
}

func incomingHeaderMatcher(key string) (string, bool) {
	if strings.EqualFold(key, "Authorization") {
		return "authorization", true
	}
	return runtime.DefaultHeaderMatcher(key)
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	gwMux := runtime.NewServeMux(
		runtime.WithIncomingHeaderMatcher(incomingHeaderMatcher),
		runtime.WithErrorHandler(gatewayErrorHandler),
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
			MarshalOptions:   protojson.MarshalOptions{UseProtoNames: true},
			UnmarshalOptions: protojson.UnmarshalOptions{DiscardUnknown: true},
		}),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	dialOpts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	if err := propertypb.RegisterPropertyServiceHandlerFromEndpoint(ctx, gwMux, cfg.PropertyServiceGRPCURL, dialOpts); err != nil {
		log.Fatalf("failed to connect property-service gRPC: %v", err)
	}
	if err := bookingpb.RegisterBookingServiceHandlerFromEndpoint(ctx, gwMux, cfg.BookingServiceGRPCURL, dialOpts); err != nil {
		log.Fatalf("failed to connect booking-service gRPC: %v", err)
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "api-gateway"})
	})

	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})
	r.GET("/swagger.json", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/json; charset=utf-8", gatewaydocs.SwaggerJSON)
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, ginSwagger.URL("/swagger.json")))

	proxy := func(targetBase string) gin.HandlerFunc {
		return func(c *gin.Context) {
			targetURL := targetBase + c.Request.URL.Path
			if c.Request.URL.RawQuery != "" {
				targetURL += "?" + c.Request.URL.RawQuery
			}

			req, err := http.NewRequest(c.Request.Method, targetURL, c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"code": 502, "message": "failed to create request"})
				return
			}

			for key, values := range c.Request.Header {
				for _, v := range values {
					req.Header.Add(key, v)
				}
			}

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"code": 502, "message": "service unavailable"})
				return
			}
			defer resp.Body.Close()

			for key, values := range resp.Header {
				for _, v := range values {
					c.Header(key, v)
				}
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"code": 502, "message": "failed to read response"})
				return
			}

			c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
		}
	}

	userProxy := proxy(cfg.UserServiceURL)
	chatProxy := proxy(cfg.ChatServiceURL)

	api := r.Group("/api/v1")
	{
		api.Any("/auth/*path", userProxy)
		api.GET("/users/me", userProxy)
		api.POST("/chats", chatProxy)
		api.GET("/chats", chatProxy)
		api.GET("/chats/:chatId/messages", chatProxy)
		api.POST("/chats/:chatId/messages", chatProxy)

		api.Any("/properties", gin.WrapH(gwMux))
		api.Any("/properties/:propertyId", gin.WrapH(gwMux))
		api.Any("/users/me/properties", gin.WrapH(gwMux))
		api.Any("/favorites", gin.WrapH(gwMux))
		api.Any("/favorites/:propertyId", gin.WrapH(gwMux))
		api.Any("/bookings", gin.WrapH(gwMux))
		api.Any("/bookings/:bookingId", gin.WrapH(gwMux))
		api.Any("/users/me/owner/bookings", gin.WrapH(gwMux))
		api.Any("/reviews", gin.WrapH(gwMux))
	}

	log.Printf("api-gateway starting on %s", cfg.WebPort)
	if err := r.Run(cfg.WebPort); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
