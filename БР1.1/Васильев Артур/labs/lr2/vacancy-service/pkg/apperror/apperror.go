package apperror

import "errors"

type Code string

const (
	CodeValidation   Code = "VALIDATION_ERROR"
	CodeUnauthorized Code = "UNAUTHORIZED"
	CodeForbidden    Code = "FORBIDDEN"
	CodeNotFound     Code = "NOT_FOUND"
	CodeConflict     Code = "CONFLICT"
	CodeInternal     Code = "INTERNAL_ERROR"
)

type AppError struct {
	Code    Code
	Message string
	Details []string
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func Validation(message string, details ...string) *AppError {
	return &AppError{Code: CodeValidation, Message: message, Details: details}
}

func Unauthorized(message string) *AppError {
	return &AppError{Code: CodeUnauthorized, Message: message}
}

func Forbidden(message string) *AppError {
	return &AppError{Code: CodeForbidden, Message: message}
}

func NotFound(message string) *AppError {
	return &AppError{Code: CodeNotFound, Message: message}
}

func Conflict(message string) *AppError {
	return &AppError{Code: CodeConflict, Message: message}
}

func Internal(err error) *AppError {
	return &AppError{Code: CodeInternal, Message: "internal server error", Err: err}
}

func IsNotFound(err error) bool {
	var ae *AppError
	return errors.As(err, &ae) && ae.Code == CodeNotFound
}

func IsConflict(err error) bool {
	var ae *AppError
	return errors.As(err, &ae) && ae.Code == CodeConflict
}
