package models

import "time"

type Cuisine struct {
	ID int `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

type Restaurant struct {
	ID int `db:"id" json:"id"`
	CuisineID int `db:"cuisine_id" json:"cuisine_id"`
	Name string `db:"name" json:"name"`
	Description *string `db:"description" json:"description"`
	City string `db:"city" json:"city"`
	Address string `db:"address" json:"address"`
	AvgPricePerPerson *float64 `db:"avg_price_per_person" json:"avg_price_per_person"`
	Status string `db:"status" json:"status"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type MenuItem struct {
	ID int `db:"id" json:"id"`
	RestaurantID int `db:"restaurant_id" json:"restaurant_id"`
	Name string `db:"name" json:"name"`
	Price float64 `db:"price" json:"price"`
	Category *string `db:"category" json:"category"`
}

type Table struct {
	ID int `db:"id" json:"id"`
	RestaurantID int `db:"restaurant_id" json:"restaurant_id"`
	Capacity int `db:"capacity" json:"capacity"`
	Label *string `db:"label" json:"label"`
}

type RestaurantFilters struct {
	Name string
	City string
	CuisineID int
	MinPrice float64
	MaxPrice float64
	SortBy string
	Limit int
	Offset int
}

type RestaurantListResponse struct {
	Total int `json:"total"`
	Items []Restaurant  `json:"items"`
}
