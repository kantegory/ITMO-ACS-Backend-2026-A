package availability

type Input struct {
	RestaurantID string `json:"restaurant_id"`
	TableID      string `json:"table_id"`
	BookingDate  string `json:"booking_date"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
}

type Output struct {
	Available bool `json:"available"`
}
