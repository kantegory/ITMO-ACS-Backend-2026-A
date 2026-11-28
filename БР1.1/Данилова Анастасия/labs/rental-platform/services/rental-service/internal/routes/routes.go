package routes

import (
	"rental-platform/services/rental-service/internal/handlers"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, h *handlers.RentalHandler, jwtSecret string) {
	r.GET("/health", h.Health)

	auth := r.Group("/")
	auth.Use(sharedmw.JWTAuth(jwtSecret))
	{
		auth.GET("/rentals", h.ListRentals)
		auth.POST("/rentals", h.CreateRental)
		auth.GET("/rentals/:rental_id", h.GetRental)
		auth.DELETE("/rentals/:rental_id", h.DeleteRental)
		auth.PATCH("/rentals/:rental_id/approve", h.ApproveRental)
		auth.PATCH("/rentals/:rental_id/reject", h.RejectRental)
		auth.PATCH("/rentals/:rental_id/complete", h.CompleteRental)
		auth.GET("/dashboard", h.Dashboard)
	}

	r.GET("/internal/rentals/property/:property_id/active", h.GetPropertyActiveRental)
}
