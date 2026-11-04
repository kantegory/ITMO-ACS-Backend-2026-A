package main

import (
	"database/sql"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	"github.com/ZZISST/rental-property-service/internal/config"
	grpcserver "github.com/ZZISST/rental-property-service/internal/grpcserver"
	"github.com/ZZISST/rental-property-service/internal/messaging"
	"github.com/ZZISST/rental-property-service/internal/observability"
	internalpb "github.com/ZZISST/rental-property-service/internal/pb"
	propertypb "github.com/ZZISST/rental-property-service/internal/pb/propertypb"
	"github.com/ZZISST/rental-property-service/internal/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	flushSentry := observability.InitSentry("property-service")
	defer flushSentry()

	db, err := sql.Open("postgres", cfg.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("property-service: connected to database")

	consumer, err := messaging.NewConsumer(cfg.RabbitMQURL)
	if err != nil {
		log.Printf("warning: RabbitMQ unavailable, events disabled: %v", err)
	} else {
		defer consumer.Close()
		err = consumer.StartConsuming(func(event messaging.BookingEvent) {
			log.Printf("received booking event: type=%s booking_id=%s property_id=%s status=%s",
				event.EventType, event.BookingID, event.PropertyID, event.Status)
		})
		if err != nil {
			log.Printf("failed to start consuming: %v", err)
		}
	}

	propertyRepo := repository.NewPropertyRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)
	propertyServer := grpcserver.NewPropertyServer(propertyRepo, favoriteRepo, cfg.JWTSecret)

	// gRPC — основное API сервиса (публичное + внутреннее)
	go func() {
		lis, err := net.Listen("tcp", cfg.GRPCPort)
		if err != nil {
			log.Fatalf("failed to listen gRPC: %v", err)
		}
		s := grpc.NewServer(grpc.ChainUnaryInterceptor(observability.UnaryServerInterceptor()))
		// grpc.health.v1 — его опрашивает blackbox_exporter (модуль grpc_health)
		observability.RegisterHealth(s, db, "property-service", 10*time.Second)
		internalpb.RegisterPropertyInternalServer(s, propertyServer) // внутренний API для booking-service
		propertypb.RegisterPropertyServiceServer(s, propertyServer)  // публичный API через gateway
		log.Printf("property-service gRPC listening on %s", cfg.GRPCPort)
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// HTTP — только health-check для Docker и мониторинга
	r := gin.Default()
	observability.GinMiddleware(r, 500)
	observability.RegisterDebugRoute(r)
	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok", "service": "property-service"})
	})

	log.Printf("property-service health endpoint on %s", cfg.WebPort)
	if err := http.ListenAndServe(cfg.WebPort, r); err != nil {
		log.Fatalf("failed to start health server: %v", err)
	}
}
