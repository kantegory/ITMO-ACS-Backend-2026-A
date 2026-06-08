package errs

import (
	"errors"
	"net/http"
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

func MethodNotAllowed(message string) *Error {
	return &Error{Status: http.StatusMethodNotAllowed, Code: "method_not_allowed", Message: message}
}

func From(err error) *Error {
	if err == nil {
		return nil
	}

	var appError *Error
	if errors.As(err, &appError) {
		return appError
	}

	return &Error{
		Status:  http.StatusInternalServerError,
		Code:    "internal_error",
		Message: "internal server error",
	}
}
