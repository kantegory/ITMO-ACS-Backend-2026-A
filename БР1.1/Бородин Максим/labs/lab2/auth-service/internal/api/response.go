package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/borodin-maksim/restaurant-booking/auth-service/internal/domain"
)

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func RespondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func RespondError(w http.ResponseWriter, status int, code, message string) {
	RespondJSON(w, status, errorBody{Code: code, Message: message})
}

func MapDomainError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrInvalidRequest):
		RespondError(w, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
	case errors.Is(err, domain.ErrEmailAlreadyExists):
		RespondError(w, http.StatusConflict, "EMAIL_EXISTS", err.Error())
	case errors.Is(err, domain.ErrInvalidCredentials):
		RespondError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error())
	case errors.Is(err, domain.ErrNotFound):
		RespondError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
	default:
		RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
	}
}
