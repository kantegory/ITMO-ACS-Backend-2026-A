package models

import "time"

type Review struct {
	ID int `db:"id" json:"id"`
	UserID int       `db:"user_id" json:"user_id"`
	RestaurantID int       `db:"restaurant_id" json:"restaurant_id"`
	BookingID    int       `db:"booking_id" json:"booking_id"`
	Rating       int       `db:"rating" json:"rating" validate:"required,min=1,max=5"`
	Comment      *string   `db:"comment" json:"comment"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type UpdateRatingReq struct {
	AvgRating float64 `json:"avg_rating"`
	ReviewsCount int `json:"reviews_count"`
}
