package register

import (
	"encoding/json"
	"net/http"
	"net/mail"
	"strings"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/infrastructure/database/model"

	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	Dep deps.Deps
}

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

func (h *Handler) Post(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Username = strings.TrimSpace(req.Username)
	req.DisplayName = strings.TrimSpace(req.DisplayName)

	var details []string
	if req.Email == "" {
		details = append(details, "email: обязательное поле")
	} else {
		addr, err := mail.ParseAddress(req.Email)
		if err != nil || strings.TrimSpace(addr.Name) != "" || !strings.EqualFold(strings.TrimSpace(addr.Address), req.Email) {
			details = append(details, "email: неверный формат")
		}
	}
	if len(req.Username) < 3 || len(req.Username) > 100 {
		details = append(details, "username: от 3 до 100 символов")
	}
	if len(req.Password) < 8 {
		details = append(details, "password: минимум 8 символов")
	}
	if req.DisplayName == "" || len(req.DisplayName) > 100 {
		details = append(details, "display_name: обязательно, максимум 100 символов")
	}
	if len(details) > 0 {
		api.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Проверьте поля формы", details...)
		return
	}

	n, err := h.Dep.Store.CountUsersByEmail(req.Email)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if n > 0 {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Пользователь с таким email уже существует")
		return
	}
	n, err = h.Dep.Store.CountUsersByUsername(req.Username)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if n > 0 {
		api.RespondError(w, http.StatusConflict, "CONFLICT", "Пользователь с таким username уже существует")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	u := model.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		DisplayName:  req.DisplayName,
	}
	if err := h.Dep.Store.CreateUser(&u); err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	pair, err := h.Dep.Store.IssueTokenPair(h.Dep.Cfg, u.ID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	api.RespondJSON(w, http.StatusCreated, map[string]any{
		"data": dto.TokenPair{
			AccessToken:  pair.AccessToken,
			RefreshToken: pair.RefreshToken,
			ExpiresIn:    pair.ExpiresIn,
		},
	})
}
