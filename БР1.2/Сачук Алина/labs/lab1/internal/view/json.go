package view

import (
	"encoding/json"
	"net/http"

	"recipe-lab1/internal/model"
)

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload != nil {
		_ = json.NewEncoder(w).Encode(payload)
	}
}

func Empty(w http.ResponseWriter, status int) {
	w.WriteHeader(status)
}

func Error(w http.ResponseWriter, status int, code string, message string, details ...model.ErrorDetail) {
	JSON(w, status, model.ErrorResponse{
		Error: model.ErrorBody{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
