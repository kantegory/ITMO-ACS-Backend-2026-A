package render

import (
	"errors"
	"log"
	"net/http"

	"github.com/getsentry/sentry-go"

	"restaurant-booking/booking-service/internal/domain"
)

var errInternalBooking = errors.New("booking request failed with an internal error")

func WriteDomainError(w http.ResponseWriter, err error) {
	log.Println(err)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		WriteError(w, http.StatusNotFound)
	case errors.Is(err, domain.ErrConflict):
		WriteError(w, http.StatusConflict)
	case errors.Is(err, domain.ErrUnauthorized):
		WriteError(w, http.StatusUnauthorized)
	case errors.Is(err, domain.ErrForbidden):
		WriteError(w, http.StatusForbidden)
	case errors.Is(err, domain.ErrInvalidInput):
		WriteError(w, http.StatusBadRequest)
	case errors.Is(err, domain.ErrUnavailable):
		WriteError(w, http.StatusConflict)
	default:
		sentry.CaptureException(errInternalBooking)
		WriteError(w, http.StatusInternalServerError)
	}
}
