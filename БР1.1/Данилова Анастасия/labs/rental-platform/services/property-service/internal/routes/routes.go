package routes

import (
	"rental-platform/services/property-service/internal/handlers"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, property *handlers.PropertyHandler, amenity *handlers.AmenityHandler, image *handlers.ImageHandler, jwtSecret string) {
	auth := sharedmw.JWTAuth(jwtSecret)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "property-service"})
	})

	r.GET("/properties", property.ListProperties)
	r.POST("/properties", auth, property.CreateProperty)
	r.GET("/properties/me", auth, property.ListMyProperties)
	r.GET("/properties/:property_id", property.GetProperty)
	r.PATCH("/properties/:property_id", auth, property.UpdateProperty)
	r.DELETE("/properties/:property_id", auth, property.DeleteProperty)

	r.GET("/properties/:property_id/images", image.ListImages)
	r.POST("/properties/:property_id/images", auth, image.AddImage)
	r.DELETE("/images/:image_id", auth, image.DeleteImage)

	r.GET("/amenities", amenity.ListAmenities)
	r.POST("/amenities", auth, amenity.CreateAmenity)
	r.PATCH("/amenities/:amenity_id", auth, amenity.UpdateAmenity)
	r.DELETE("/amenities/:amenity_id", auth, amenity.DeleteAmenity)

	r.GET("/internal/properties/:property_id", property.GetInternalProperty)
}
