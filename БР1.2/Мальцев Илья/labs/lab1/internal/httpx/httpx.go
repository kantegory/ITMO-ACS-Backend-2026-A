package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"job-search-api/internal/errs"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if payload == nil {
		return
	}

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func WriteError(w http.ResponseWriter, err error) {
	appError := errs.From(err)
	WriteJSON(w, appError.Status, ErrorResponse{
		Error:   appError.Code,
		Message: appError.Message,
	})
}

func DecodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return errs.BadRequest("request body is required")
	}
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		return errs.BadRequest("invalid JSON body")
	}

	if err := decoder.Decode(&struct{}{}); errors.Is(err, io.EOF) {
		return nil
	}

	return errs.BadRequest("request body must contain a single JSON value")
}

func ApplyCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
}
