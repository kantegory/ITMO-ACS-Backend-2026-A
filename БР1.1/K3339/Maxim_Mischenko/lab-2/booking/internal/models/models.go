package models

import "time"

type Booking struct {
	ID int `db:"db" json:"id"`
	UserID int `db:"user_id" json:"user_id"`
	RestaurantID int `db:"restaurant_id" json:"restaurant_id"`
	TableID int `db:"table_id" json:"table_id"`
	BookingDate string `db:"booking_date" json:"booking_date"`
	StartTime string `db:"start_time" json:"start_time"`
	EndTime string `db:"end_time" json:"end_time"`
	GuestsCount int `db:"guests_count" json:"guests_count"`
	Status string `db:"status" json:"status"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
