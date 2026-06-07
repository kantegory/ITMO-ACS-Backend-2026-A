package httputil

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"profile-service/pkg/apperror"
)

type errorBody struct {
	Error struct {
		Code    apperror.Code `json:"code"`
		Message string        `json:"message"`
		Details []string      `json:"details,omitempty"`
	} `json:"error"`
}

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func WriteError(w http.ResponseWriter, err error) {
	var ae *apperror.AppError
	if !errors.As(err, &ae) {
		ae = apperror.Internal(err)
	}

	status := http.StatusInternalServerError
	switch ae.Code {
	case apperror.CodeValidation:
		status = http.StatusBadRequest
	case apperror.CodeUnauthorized:
		status = http.StatusUnauthorized
	case apperror.CodeForbidden:
		status = http.StatusForbidden
	case apperror.CodeNotFound:
		status = http.StatusNotFound
	case apperror.CodeConflict:
		status = http.StatusConflict
	}

	slog.Default().With("layer", "http").Warn("api error response",
		slog.Int("status", status),
		slog.String("code", string(ae.Code)),
		slog.String("message", ae.Message),
	)

	body := errorBody{}
	body.Error.Code = ae.Code
	body.Error.Message = ae.Message
	body.Error.Details = ae.Details
	WriteJSON(w, status, body)
}

func DecodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return apperror.Validation("request body is required")
	}
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return apperror.Validation("invalid JSON body")
	}
	return nil
}
