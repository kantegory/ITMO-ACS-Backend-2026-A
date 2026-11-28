package events

const ExchangeName = "rental.events"

const (
	UserCreated         = "user.created"
	UserDeleted         = "user.deleted"
	PropertyCreated     = "property.created"
	PropertyUpdated     = "property.updated"
	PropertyDeleted     = "property.deleted"
	RentalCreated       = "rental.created"
	RentalStatusChanged = "rental.status_changed"
	RentalCompleted     = "rental.completed"
	ChatCreated         = "chat.created"
	MessageSent         = "message.sent"
)

type UserCreatedPayload struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
}

type UserDeletedPayload struct {
	UserID uint `json:"user_id"`
}

type PropertyPayload struct {
	PropertyID uint `json:"property_id"`
	OwnerID    uint `json:"owner_id"`
}

type RentalCreatedPayload struct {
	RentalID   uint `json:"rental_id"`
	PropertyID uint `json:"property_id"`
	TenantID   uint `json:"tenant_id"`
	LandlordID uint `json:"landlord_id"`
}

type RentalStatusPayload struct {
	RentalID   uint   `json:"rental_id"`
	PropertyID uint   `json:"property_id"`
	Status     string `json:"status"`
}

type RentalCompletedPayload struct {
	RentalID   uint `json:"rental_id"`
	PropertyID uint `json:"property_id"`
}

type ChatCreatedPayload struct {
	ChatID     uint `json:"chat_id"`
	PropertyID uint `json:"property_id"`
	TenantID   uint `json:"tenant_id"`
	LandlordID uint `json:"landlord_id"`
}

type MessageSentPayload struct {
	MessageID uint `json:"message_id"`
	ChatID    uint `json:"chat_id"`
	SenderID  uint `json:"sender_id"`
}
