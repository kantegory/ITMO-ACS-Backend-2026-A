package restaurantclient

import "errors"

// Sentinel errors returned by the restaurant HTTP client.
var (
	ErrTableNotFound      = errors.New("table not found")
	ErrRestaurantNotFound = errors.New("restaurant not found")
)
