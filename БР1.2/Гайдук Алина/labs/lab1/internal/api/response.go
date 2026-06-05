package api

import (
	"encoding/json"
	"net/http"
)

type errBody struct {
	Error struct {
		Code    string   `json:"code"`
		Message string   `json:"message"`
		Details []string `json:"details,omitempty"`
	} `json:"error"`
}

func RespondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func RespondError(w http.ResponseWriter, status int, code, message string, details ...string) {
	var b errBody
	b.Error.Code = code
	b.Error.Message = message
	if len(details) > 0 {
		b.Error.Details = details
	}
	RespondJSON(w, status, b)
}
