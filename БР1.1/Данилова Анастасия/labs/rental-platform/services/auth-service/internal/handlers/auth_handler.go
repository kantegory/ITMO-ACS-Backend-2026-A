package handlers

import (
	"net/http"
	"strconv"

	"rental-platform/services/auth-service/internal/models"
	"rental-platform/services/auth-service/internal/services"
	sharedmw "rental-platform/shared/middleware"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Service *services.AuthService
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email     string `json:"email" binding:"required,email"`
		Password  string `json:"password" binding:"required,min=6"`
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		Role      string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, err := h.Service.Register(c.Request.Context(), services.RegisterInput{
		Email: req.Email, Password: req.Password,
		FirstName: req.FirstName, LastName: req.LastName, Role: req.Role,
	})
	if err != nil {
		if err.Error() == "user already exists" {
			c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toUserPublic(user))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	tokens, err := h.Service.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tokens)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	tokens, err := h.Service.Refresh(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&req)
	_ = h.Service.Logout(req.RefreshToken)
	if uid, ok := sharedmw.UserID(c); ok {
		_ = h.Service.LogoutAll(uid)
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	user, err := h.Service.Users.GetByID(uid)
	if err != nil {
		if services.IsNotFound(err) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load user"})
		return
	}
	c.JSON(http.StatusOK, toUserPublic(user))
}

func (h *AuthHandler) UpdateMe(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var req struct {
		FirstName *string `json:"first_name"`
		LastName  *string `json:"last_name"`
		Email     *string `json:"email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	user, err := h.Service.UpdateProfile(uid, req.FirstName, req.LastName, req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toUserPublic(user))
}

func (h *AuthHandler) DeleteMe(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	if err := h.Service.SoftDelete(c.Request.Context(), uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete user"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	uid, ok := sharedmw.UserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.Service.ChangePassword(uid, req.CurrentPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) ListUsers(c *gin.Context) {
	limit, offset := pagination(c)
	users, total, err := h.Service.Users.List(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list users"})
		return
	}
	items := make([]gin.H, 0, len(users))
	for i := range users {
		items = append(items, toUserPublic(&users[i]))
	}
	c.JSON(http.StatusOK, gin.H{"users": items, "total": total})
}

func (h *AuthHandler) GetUser(c *gin.Context) {
	id, err := parseID(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	user, err := h.Service.Users.GetByID(id)
	if err != nil {
		if services.IsNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load user"})
		return
	}
	c.JSON(http.StatusOK, toUserPublic(user))
}

func (h *AuthHandler) GetInternalUser(c *gin.Context) {
	id, err := parseID(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	user, err := h.Service.Users.GetByID(id)
	if err != nil {
		if services.IsNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to load user"})
		return
	}
	if !user.IsActive {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID,
		"role":      user.Role,
		"is_active": user.IsActive,
	})
}

func (h *AuthHandler) ValidateUsers(c *gin.Context) {
	var req struct {
		UserIDs []uint `json:"user_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	valid, invalid, err := h.Service.ValidateUsers(req.UserIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "validation failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"valid": valid, "invalid_user_ids": invalid})
}

func (h *AuthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "auth-service"})
}

func toUserPublic(user *models.User) gin.H {
	return gin.H{
		"id":          user.ID,
		"email":       user.Email,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"role":        user.Role,
		"is_verified": user.IsVerified,
		"is_active":   user.IsActive,
		"created_at":  user.CreatedAt,
		"updated_at":  user.UpdatedAt,
	}
}

func parseID(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 64)
	return uint(v), err
}

func pagination(c *gin.Context) (int, int) {
	limit, offset := 20, 0
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}
	return limit, offset
}
