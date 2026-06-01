package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"job-search/internal/repository"
)

type DictionariesHandler struct {
	repos *repository.Repositories
}

func (h *DictionariesHandler) ListIndustries(c *gin.Context) {
	industries, err := h.repos.Dictionaries.ListIndustries(c.Request.Context())
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list industries")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": industries})
}

func (h *DictionariesHandler) ListSkills(c *gin.Context) {
	search := c.Query("search")
	skills, err := h.repos.Dictionaries.ListSkills(c.Request.Context(), search)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list skills")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": skills})
}

func (h *DictionariesHandler) ListCurrencies(c *gin.Context) {
	currencies, err := h.repos.Dictionaries.ListCurrencies(c.Request.Context())
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list currencies")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": currencies})
}
