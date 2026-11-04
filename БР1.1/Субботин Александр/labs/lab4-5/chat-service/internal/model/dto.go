package model

type SendMessageRequest struct {
	Text string `json:"text" binding:"required"`
}

type CreateChatRequest struct {
	ParticipantID string  `json:"participant_id" binding:"required"`
	PropertyID    *string `json:"property_id"`
	BookingID     *string `json:"booking_id"`
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
