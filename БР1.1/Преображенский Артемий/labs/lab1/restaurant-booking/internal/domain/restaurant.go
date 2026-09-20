package domain

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type City string

type Address string

type CuisineType string

type PriceCategory string

type URL string

type Restaurant struct {
	ID            uuid.UUID     `json:"id"`
	Name          string        `json:"name"`
	Description   string        `json:"description"`
	City          City          `json:"city"`
	Address       Address       `json:"address"`
	Photos        []URL         `json:"photos"`
	CreatedAt     time.Time     `json:"created_at"`
	PriceCategory PriceCategory `json:"price_category"`
	CuisineType   CuisineType   `json:"cuisine_type"`
}

func (r Restaurant) Validate() error {
	if strings.TrimSpace(r.Name) == "" ||
		strings.TrimSpace(r.Description) == "" ||
		strings.TrimSpace(string(r.City)) == "" ||
		strings.TrimSpace(string(r.Address)) == "" ||
		strings.TrimSpace(string(r.CuisineType)) == "" ||
		strings.TrimSpace(string(r.PriceCategory)) == "" {
		return ErrInvalidInput
	}
	return nil
}
