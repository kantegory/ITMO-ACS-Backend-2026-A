package login

import (
	"encoding/json"
	"net/http"
	"strings"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/infrastructure/database"

	"golang.org/x/crypto/bcrypt"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

type Request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Post(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Поле email обязательно", "email: обязательное поле")
		return
	}
	u, err := h.Dep.Store.UserByEmail(req.Email)
	if err != nil {
		if database.IsRecordNotFound(err) {
			api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Неверный email или пароль")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)) != nil {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Неверный email или пароль")
		return
	}
	pair, err := h.Dep.Store.IssueTokenPair(h.Dep.Cfg, u.ID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusOK, map[string]any{
		"data": dto.TokenPair{
			AccessToken:  pair.AccessToken,
			RefreshToken: pair.RefreshToken,
			ExpiresIn:    pair.ExpiresIn,
		},
	})
}
