package loginhandler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/internal/api"
	uc "github.com/borodin-maksim/restaurant-booking/internal/usecase/login"
)

type useCase interface {
	Login(ctx context.Context, req uc.Request) (string, error)
}

type Handler struct {
	uc        useCase
	jwtSecret string
}

func New(uc useCase, jwtSecret string) *Handler {
	return &Handler{uc: uc, jwtSecret: jwtSecret}
}

type request struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type response struct {
	Token string `json:"token"`
}

func (h *Handler) Handle(w http.ResponseWriter, r *http.Request) {
	var req request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid json")
		return
	}

	token, err := h.uc.Login(r.Context(), uc.Request{
		Email:     req.Email,
		Password:  req.Password,
		JWTSecret: h.jwtSecret,
	})
	if err != nil {
		api.MapDomainError(w, err)
		return
	}

	api.RespondJSON(w, http.StatusOK, response{Token: token})
}
