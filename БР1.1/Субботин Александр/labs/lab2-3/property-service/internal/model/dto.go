package model

type CreatePropertyRequest struct {
	Title         string   `json:"title" binding:"required"`
	Description   string   `json:"description" binding:"required"`
	PropertyType  string   `json:"property_type" binding:"required"`
	PricePerNight float64  `json:"price_per_night" binding:"required,gt=0"`
	City          string   `json:"city" binding:"required"`
	MaxGuests     int      `json:"max_guests" binding:"required,gt=0"`
	Address       *string  `json:"address"`
	Rooms         *int     `json:"rooms"`
	Beds          *int     `json:"beds"`
	AreaM2        *float64 `json:"area_m2"`
	CheckInTime   *string  `json:"check_in_time"`
	CheckOutTime  *string  `json:"check_out_time"`
	Rules         *string  `json:"rules"`
	AmenityIDs    []string `json:"amenity_ids"`
}

type UpdatePropertyRequest struct {
	Title         *string  `json:"title"`
	Description   *string  `json:"description"`
	PricePerNight *float64 `json:"price_per_night"`
	City          *string  `json:"city"`
	MaxGuests     *int     `json:"max_guests"`
	Rooms         *int     `json:"rooms"`
	Status        *string  `json:"status"`
	AmenityIDs    []string `json:"amenity_ids"`
}

type PropertyFilter struct {
	City         *string  `form:"city"`
	PropertyType *string  `form:"property_type"`
	PriceMin     *float64 `form:"price_min"`
	PriceMax     *float64 `form:"price_max"`
	Rooms        *int     `form:"rooms"`
	MaxGuests    *int     `form:"max_guests"`
	Limit        int      `form:"limit,default=20"`
	Offset       int      `form:"offset,default=0"`
}

type PaginatedResponse struct {
	Items      any        `json:"items"`
	Pagination Pagination `json:"pagination"`
}

type Pagination struct {
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
	Total  int `json:"total"`
}

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}
