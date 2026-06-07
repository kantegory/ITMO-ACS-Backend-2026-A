package internalapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	authuc "auth-service/internal/usecase/auth"
	"auth-service/pkg/httputil"
)

type Handler struct {
	uc *authuc.UseCase
}

func NewHandler(uc *authuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	user, err := h.uc.GetUser(r.Context(), id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]any{
		"id":    user.ID.String(),
		"email": user.Email,
		"role":  string(user.Role),
	})
}
