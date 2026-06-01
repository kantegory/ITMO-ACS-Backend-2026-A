package domain

import "errors"

var (
	ErrNotFound             = errors.New("not found")
	ErrForbidden            = errors.New("forbidden")
	ErrInvalidRequest       = errors.New("invalid request")
	ErrTableAlreadyBooked   = errors.New("table already booked for this time")
	ErrBookingNotCancellable = errors.New("booking cannot be cancelled")
)
