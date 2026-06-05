package refresh

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"recipehub/internal/api"
	"recipehub/internal/api/deps"
	"recipehub/internal/api/dto"
	"recipehub/internal/infrastructure/database"
	jwtsec "recipehub/internal/infrastructure/security/jwt"
)

type Handler struct{ Dep deps.Deps }

func New(d deps.Deps) *Handler { return &Handler{Dep: d} }

type Request struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *Handler) Post(w http.ResponseWriter, r *http.Request) {
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "Невалидный формат JSON")
		return
	}
	req.RefreshToken = strings.TrimSpace(req.RefreshToken)
	if req.RefreshToken == "" {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Невалидный refresh-токен")
		return
	}
	hash := jwtsec.HashToken(req.RefreshToken)
	rt, err := h.Dep.Store.RefreshByHash(hash)
	if err != nil {
		if database.IsRecordNotFound(err) {
			api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Невалидный refresh-токен")
			return
		}
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if time.Now().UTC().After(rt.ExpiresAt.UTC()) {
		api.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Невалидный refresh-токен")
		return
	}
	pair, err := h.Dep.Store.IssueTokenPair(h.Dep.Cfg, rt.UserID)
	if err != nil {
		api.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
		return
	}
	if err := h.Dep.Store.DeleteRefreshByHash(hash); err != nil {
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
