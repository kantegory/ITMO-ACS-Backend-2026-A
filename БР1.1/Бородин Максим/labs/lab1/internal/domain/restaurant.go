package domain

import "time"

type Restaurant struct {
	ID          string
	Name        string
	Description string
	CuisineType string
	Location    string
	PriceRange  int
	CreatedAt   time.Time

	Photos    []string
	AvgRating float64
}

type Table struct {
	ID           string
	RestaurantID string
	TableNumber  int
	Capacity     int
}

type MenuItem struct {
	ID           string
	RestaurantID string
	Name         string
	Description  string
	Price        float64
	Category     string
}

type Review struct {
	ID           string
	UserID       string
	RestaurantID string
	Rating       int
	Comment      string
	CreatedAt    time.Time
}
