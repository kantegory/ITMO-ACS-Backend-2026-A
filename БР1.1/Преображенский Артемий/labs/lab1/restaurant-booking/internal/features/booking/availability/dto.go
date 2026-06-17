package availability

type Input struct {
	RestaurantID string
	TableID      string
	BookingDate  string
	StartTime    string
	EndTime      string
}

type Output struct {
	Available bool
}
