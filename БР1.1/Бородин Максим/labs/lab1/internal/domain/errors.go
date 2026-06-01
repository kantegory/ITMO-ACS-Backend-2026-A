package domain

import "errors"

var (
	ErrEmailAlreadyExists   = errors.New("email already exists")
	ErrInvalidCredentials   = errors.New("invalid credentials")
	ErrNotFound             = errors.New("not found")
	ErrForbidden            = errors.New("forbidden")
	ErrTableAlreadyBooked   = errors.New("table already booked for this time")
	ErrBookingNotCancellable = errors.New("booking cannot be cancelled")
	ErrReviewAlreadyExists  = errors.New("review already exists")
	ErrInvalidRequest       = errors.New("invalid request")
)
