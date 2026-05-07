package domain

import "errors"

var (
	ErrNotFound            = errors.New("not found")
	ErrForbidden           = errors.New("forbidden")
	ErrInvalidRequest      = errors.New("invalid request")
	ErrReviewAlreadyExists = errors.New("review already exists")
)
