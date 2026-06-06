package main

import (
	"database/sql"
	"log"
	"net"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"

	"github.com/ZZISST/rental-booking-service/internal/client"
	"github.com/ZZISST/rental-booking-service/internal/config"
	grpcserver "github.com/ZZISST/rental-booking-service/internal/grpcserver"
	"github.com/ZZISST/rental-booking-service/internal/messaging"
	bookingpb "github.com/ZZISST/rental-booking-service/internal/pb/bookingpb"
	"github.com/ZZISST/rental-booking-service/internal/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := sql.Open("postgres", cfg.DSN())
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}
	log.Println("booking-service: connected to database")

	publisher, err := messaging.NewPublisher(cfg.RabbitMQURL)
	if err != nil {
		log.Printf("warning: RabbitMQ unavailable, events disabled: %v", err)
	} else {
		defer publisher.Close()
	}

	propertyClient, err := client.NewPropertyClient(cfg.PropertyServiceURL)
	if err != nil {
		log.Fatalf("failed to connect to property-service gRPC: %v", err)
	}
	defer propertyClient.Close()
	log.Println("booking-service: connected to property-service via gRPC")

	bookingRepo := repository.NewBookingRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	bookingServer := grpcserver.NewBookingServer(bookingRepo, reviewRepo, propertyClient, publisher, cfg.JWTSecret)

	// gRPC — основное API сервиса
	go func() {
		lis, err := net.Listen("tcp", cfg.GRPCPort)
		if err != nil {
			log.Fatalf("failed to listen gRPC: %v", err)
		}
		s := grpc.NewServer()
		bookingpb.RegisterBookingServiceServer(s, bookingServer)
		log.Printf("booking-service gRPC listening on %s", cfg.GRPCPort)
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// HTTP — только health-check для Docker и мониторинга
	r := gin.Default()
	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok", "service": "booking-service"})
	})

	log.Printf("booking-service health endpoint on %s", cfg.WebPort)
	if err := r.Run(cfg.WebPort); err != nil {
		log.Fatalf("failed to start health server: %v", err)
	}
}
