package handler

import (
	"encoding/json"
	"net/http"
)


func errorResponse(code, message string) map[string]string {
	return map[string]string{
		"error_code":    code,
		"error_message": message,
	}
}


func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}