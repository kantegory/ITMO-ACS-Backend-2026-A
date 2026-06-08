package platform

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Error struct {
	Status  int
	Code    string
	Message string
}

func (err *Error) Error() string {
	return err.Message
}

func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Code: "bad_request", Message: message}
}

func Unauthorized(message string) *Error {
	return &Error{Status: http.StatusUnauthorized, Code: "unauthorized", Message: message}
}

func Forbidden(message string) *Error {
	return &Error{Status: http.StatusForbidden, Code: "forbidden", Message: message}
}

func NotFound(message string) *Error {
	return &Error{Status: http.StatusNotFound, Code: "not_found", Message: message}
}

func Conflict(message string) *Error {
	return &Error{Status: http.StatusConflict, Code: "conflict", Message: message}
}

func MethodNotAllowed() *Error {
	return &Error{Status: http.StatusMethodNotAllowed, Code: "method_not_allowed", Message: "method is not allowed for this route"}
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func WriteError(w http.ResponseWriter, err error) {
	var appError *Error
	if !errors.As(err, &appError) {
		appError = &Error{Status: http.StatusInternalServerError, Code: "internal_error", Message: "internal server error"}
	}
	WriteJSON(w, appError.Status, map[string]string{
		"error":   appError.Code,
		"message": appError.Message,
	})
}

func DecodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return BadRequest("request body is required")
	}
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return BadRequest("invalid JSON body")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return BadRequest("request body must contain a single JSON value")
	}
	return nil
}

func CORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
}

func RequireMethod(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method == method {
		return true
	}
	WriteError(w, MethodNotAllowed())
	return false
}

func SplitPath(path string) []string {
	trimmed := strings.Trim(path, "/")
	if trimmed == "" {
		return nil
	}
	return strings.Split(trimmed, "/")
}

func BearerToken(r *http.Request) (string, error) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if header == "" {
		return "", Unauthorized("authorization header is required")
	}
	if !strings.HasPrefix(header, "Bearer ") {
		return "", Unauthorized("authorization header must use Bearer scheme")
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if token == "" {
		return "", Unauthorized("access token is required")
	}
	return token, nil
}

func IntQuery(raw string, defaultValue int) (int, error) {
	if strings.TrimSpace(raw) == "" {
		return defaultValue, nil
	}
	return strconv.Atoi(raw)
}

func OptionalIntQuery(raw string) (*int, error) {
	if strings.TrimSpace(raw) == "" {
		return nil, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return nil, err
	}
	return &value, nil
}

func CommaSeparated(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	values := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value != "" {
			values = append(values, value)
		}
	}
	return values
}

func NewID() string {
	now := time.Now().UnixNano()
	return fmt.Sprintf("%08x-%04x-4%03x-8%03x-%012x", rand.Uint32(), rand.Uint32()&0xffff, rand.Uint32()&0xfff, rand.Uint32()&0xfff, now&0xffffffffffff)
}

func NormalizePagination(page int, limit int) (int, int) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}
