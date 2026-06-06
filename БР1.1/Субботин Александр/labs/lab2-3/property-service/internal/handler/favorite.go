package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-property-service/internal/middleware"
	"github.com/ZZISST/rental-property-service/internal/model"
	"github.com/ZZISST/rental-property-service/internal/repository"
)

type FavoriteHandler struct {
	favoriteRepo *repository.FavoriteRepository
	propertyRepo *repository.PropertyRepository
}

func NewFavoriteHandler(favoriteRepo *repository.FavoriteRepository, propertyRepo *repository.PropertyRepository) *FavoriteHandler {
	return &FavoriteHandler{favoriteRepo: favoriteRepo, propertyRepo: propertyRepo}
}

// @Summary      Список избранного
// @Tags         favorites
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} model.Property
// @Failure      401 {object} model.ErrorResponse
// @Router       /favorites [get]
func (h *FavoriteHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	properties, err := h.favoriteRepo.List(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, properties)
}

// @Summary      Добавить в избранное
// @Tags         favorites
// @Produce      json
// @Security     BearerAuth
// @Param        propertyId path string true "ID объявления"
// @Success      201 {object} model.Favorite
// @Failure      401 {object} model.ErrorResponse
// @Failure      404 {object} model.ErrorResponse
// @Failure      409 {object} model.ErrorResponse "Уже в избранном"
// @Router       /favorites/{propertyId} [post]
func (h *FavoriteHandler) Add(c *gin.Context) {
	userID := middleware.GetUserID(c)
	propertyID := c.Param("propertyId")

	_, err := h.propertyRepo.GetByID(propertyID)
	if err != nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
		return
	}

	exists, err := h.favoriteRepo.Exists(userID, propertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, model.ErrorResponse{Code: 409, Message: "already in favorites"})
		return
	}

	fav, err := h.favoriteRepo.Add(userID, propertyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to add to favorites"})
		return
	}

	c.JSON(http.StatusCreated, fav)
}

// @Summary      Удалить из избранного
// @Tags         favorites
// @Security     BearerAuth
// @Param        propertyId path string true "ID объявления"
// @Success      204
// @Failure      401 {object} model.ErrorResponse
// @Router       /favorites/{propertyId} [delete]
func (h *FavoriteHandler) Remove(c *gin.Context) {
	userID := middleware.GetUserID(c)
	propertyID := c.Param("propertyId")

	if err := h.favoriteRepo.Remove(userID, propertyID); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to remove from favorites"})
		return
	}

	c.Status(http.StatusNoContent)
}
