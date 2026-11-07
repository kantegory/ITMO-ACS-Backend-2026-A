package model

type CreateBookingRequest struct {
	PropertyID  string `json:"property_id" binding:"required"`
	StartDate   string `json:"start_date" binding:"required"`
	EndDate     string `json:"end_date" binding:"required"`
	GuestsCount int    `json:"guests_count" binding:"required,gt=0"`
}

type UpdateBookingStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=approved rejected cancelled completed"`
}

type BookingFilter struct {
	Status *string `form:"status"`
	Limit  int     `form:"limit,default=20"`
	Offset int     `form:"offset,default=0"`
}

type CreateReviewRequest struct {
	BookingID string  `json:"booking_id" binding:"required"`
	Rating    int     `json:"rating" binding:"required,min=1,max=5"`
	Text      *string `json:"text"`
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
