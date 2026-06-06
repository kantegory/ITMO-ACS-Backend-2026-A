package handler

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ZZISST/rental-api/internal/middleware"
	"github.com/ZZISST/rental-api/internal/model"
	"github.com/ZZISST/rental-api/internal/repository"
)

type PropertyHandler struct {
	propertyRepo *repository.PropertyRepository
}

func NewPropertyHandler(propertyRepo *repository.PropertyRepository) *PropertyHandler {
	return &PropertyHandler{propertyRepo: propertyRepo}
}

// Create godoc
// @Summary      Создать объявление
// @Tags         properties
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body model.CreatePropertyRequest true "Данные объявления"
// @Success      201 {object} model.Property
// @Failure      400 {object} model.ErrorResponse
// @Failure      401 {object} model.ErrorResponse
// @Router       /properties [post]
func (h *PropertyHandler) Create(c *gin.Context) {
	var req model.CreatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	ownerID := middleware.GetUserID(c)
	property, err := h.propertyRepo.Create(ownerID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to create property", Details: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, property)
}

// List godoc
// @Summary      Список объявлений
// @Tags         properties
// @Produce      json
// @Param        city          query string  false "Город"
// @Param        property_type query string  false "Тип (apartment, house, ...)"
// @Param        price_min     query number  false "Минимальная цена за ночь"
// @Param        price_max     query number  false "Максимальная цена за ночь"
// @Param        rooms         query integer false "Кол-во комнат"
// @Param        max_guests    query integer false "Вместимость"
// @Param        limit         query integer false "Лимит" default(20)
// @Param        offset        query integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      400 {object} model.ErrorResponse
// @Router       /properties [get]
func (h *PropertyHandler) List(c *gin.Context) {
	var filter model.PropertyFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid query params", Details: err.Error()})
		return
	}

	properties, total, err := h.propertyRepo.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items: properties,
		Pagination: model.Pagination{
			Limit:  filter.Limit,
			Offset: filter.Offset,
			Total:  total,
		},
	})
}

// GetByID godoc
// @Summary      Получить объявление по ID
// @Tags         properties
// @Produce      json
// @Param        propertyId path string true "ID объявления"
// @Success      200 {object} model.Property
// @Failure      404 {object} model.ErrorResponse
// @Router       /properties/{propertyId} [get]
func (h *PropertyHandler) GetByID(c *gin.Context) {
	id := c.Param("propertyId")
	property, err := h.propertyRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	c.JSON(http.StatusOK, property)
}

// Update godoc
// @Summary      Обновить объявление
// @Tags         properties
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        propertyId path string true "ID объявления"
// @Param        body       body model.UpdatePropertyRequest true "Поля для обновления"
// @Success      200 {object} model.Property
// @Failure      400 {object} model.ErrorResponse
// @Failure      403 {object} model.ErrorResponse "Не владелец"
// @Failure      404 {object} model.ErrorResponse
// @Router       /properties/{propertyId} [patch]
func (h *PropertyHandler) Update(c *gin.Context) {
	id := c.Param("propertyId")
	ownerID := middleware.GetUserID(c)

	// Checking owner
	existing, err := h.propertyRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if existing.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "you are not the owner"})
		return
	}

	var req model.UpdatePropertyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{Code: 400, Message: "invalid request", Details: err.Error()})
		return
	}

	property, err := h.propertyRepo.Update(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to update"})
		return
	}

	c.JSON(http.StatusOK, property)
}

// Delete godoc
// @Summary      Удалить объявление
// @Tags         properties
// @Security     BearerAuth
// @Param        propertyId path string true "ID объявления"
// @Success      204 "No Content"
// @Failure      403 {object} model.ErrorResponse "Не владелец"
// @Failure      404 {object} model.ErrorResponse
// @Router       /properties/{propertyId} [delete]
func (h *PropertyHandler) Delete(c *gin.Context) {
	id := c.Param("propertyId")
	ownerID := middleware.GetUserID(c)

	existing, err := h.propertyRepo.GetByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, model.ErrorResponse{Code: 404, Message: "property not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}
	if existing.OwnerID != ownerID {
		c.JSON(http.StatusForbidden, model.ErrorResponse{Code: 403, Message: "you are not the owner"})
		return
	}

	if err := h.propertyRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "failed to delete"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ListMyProperties godoc
// @Summary      Мои объявления
// @Tags         properties
// @Produce      json
// @Security     BearerAuth
// @Param        limit  query integer false "Лимит"  default(20)
// @Param        offset query integer false "Смещение" default(0)
// @Success      200 {object} model.PaginatedResponse
// @Failure      401 {object} model.ErrorResponse
// @Router       /users/me/properties [get]
func (h *PropertyHandler) ListMyProperties(c *gin.Context) {
	ownerID := middleware.GetUserID(c)
	limit := 20
	offset := 0
	// parsing from query
	if l, ok := c.GetQuery("limit"); ok {
		fmt.Sscanf(l, "%d", &limit)
	}
	if o, ok := c.GetQuery("offset"); ok {
		fmt.Sscanf(o, "%d", &offset)
	}

	properties, total, err := h.propertyRepo.ListByOwner(ownerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{Code: 500, Message: "internal error"})
		return
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Items:      properties,
		Pagination: model.Pagination{Limit: limit, Offset: offset, Total: total},
	})
}
