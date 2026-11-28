package availability

import "time"

type Input struct {
	RestaurantID string
	TableID      string
	StartTime    time.Time
	EndTime      time.Time
}

type Output struct {
	Available bool
}
