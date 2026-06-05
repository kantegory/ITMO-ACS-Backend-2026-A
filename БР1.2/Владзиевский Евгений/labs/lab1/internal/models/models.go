package models

import (
	"time"
)

type PropertyType struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"type:varchar(50);unique;not null" json:"name"`
}

type Amenity struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string  `gorm:"type:varchar(100);unique;not null" json:"name"`
	Icon        *string `gorm:"type:varchar(50)" json:"icon,omitempty"`
	Description *string `gorm:"type:text" json:"description,omitempty"`
}

type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email        string    `gorm:"type:varchar(150);unique;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	FullName     string    `gorm:"type:varchar(100);not null" json:"full_name"`
	Phone        *string   `gorm:"type:varchar(20)" json:"phone,omitempty"`
	Role         string    `gorm:"type:varchar(20);default:'tenant';check:role IN ('tenant', 'owner', 'admin')" json:"role"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type Property struct {
	ID          uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerID     uint            `json:"owner_id"`
	Owner       User            `gorm:"foreignKey:OwnerID;constraint:OnDelete:CASCADE" json:"owner"`
	TypeID      *uint           `json:"type_id"`
	Type        PropertyType    `gorm:"foreignKey:TypeID;constraint:OnDelete:SET NULL" json:"type,omitempty"`
	Title       string          `gorm:"type:varchar(255);not null" json:"title"`
	Description *string         `gorm:"type:text" json:"description,omitempty"`
	PricePerDay float64         `gorm:"type:decimal(12,2);not null;check:price_per_day > 0" json:"price_per_day"`
	City        string          `gorm:"type:varchar(100);not null" json:"city"`
	Address     string          `gorm:"type:text;not null" json:"address"`
	Latitude    *float64        `gorm:"type:decimal(9,6)" json:"latitude,omitempty"`
	Longitude   *float64        `gorm:"type:decimal(9,6)" json:"longitude,omitempty"`
	Status      string          `gorm:"type:varchar(20);default:'active';check:status IN ('active', 'archived')" json:"status"`
	CreatedAt   time.Time       `gorm:"autoCreateTime" json:"created_at"`
	Images      []PropertyImage `gorm:"foreignKey:PropertyID;constraint:OnDelete:CASCADE" json:"images,omitempty"`
	Amenities   []Amenity       `gorm:"many2many:property_amenities;" json:"amenities,omitempty"`
}

type PropertyImage struct {
	ID         uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	PropertyID uint   `json:"property_id"`
	ImageURL   string `gorm:"type:text;not null" json:"image_url"`
	IsMain     bool   `gorm:"default:false" json:"is_main"`
}

type Rental struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID   uint      `json:"tenant_id"`
	Tenant     User      `gorm:"foreignKey:TenantID" json:"tenant"`
	PropertyID uint      `json:"property_id"`
	Property   Property  `gorm:"foreignKey:PropertyID" json:"property"`
	StartDate  time.Time `gorm:"type:date;not null" json:"start_date"`
	EndDate    time.Time `gorm:"type:date;not null" json:"end_date"`
	TotalPrice float64   `gorm:"type:decimal(12,2);not null" json:"total_price"`
	Status     string    `gorm:"type:varchar(20);default:'pending';check:status IN ('pending', 'confirmed', 'paid', 'cancelled', 'finished')" json:"status"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type Message struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	SenderID    uint      `json:"sender_id"`
	Sender      User      `gorm:"foreignKey:SenderID" json:"sender"`
	ReceiverID  uint      `json:"receiver_id"`
	Receiver    User      `gorm:"foreignKey:ReceiverID" json:"receiver"`
	PropertyID  uint      `json:"property_id"`
	Property    Property  `gorm:"foreignKey:PropertyID" json:"property"`
	MessageText string    `gorm:"type:text;not null" json:"message_text"`
	SentAt      time.Time `gorm:"autoCreateTime" json:"sent_at"`
}

type Transaction struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RentalID       uint      `json:"rental_id"`
	Rental         Rental    `gorm:"foreignKey:RentalID;constraint:OnDelete:CASCADE" json:"rental"`
	Amount         float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	PaymentMethod  *string   `gorm:"type:varchar(50)" json:"payment_method,omitempty"`
	IdempotencyKey *string   `gorm:"type:varchar(64);uniqueIndex" json:"idempotency_key,omitempty"`
	Type           string    `gorm:"type:varchar(20);default:'payment';check:type IN ('payment', 'refund')" json:"type"`
	Status         string    `gorm:"type:varchar(20);default:'success';check:status IN ('success', 'failed', 'pending', 'refunded')" json:"status"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// TableName overrides the default table names (optional)
func (PropertyType) TableName() string  { return "property_types" }
func (Amenity) TableName() string       { return "amenities" }
func (User) TableName() string          { return "users" }
func (Property) TableName() string      { return "properties" }
func (PropertyImage) TableName() string { return "property_images" }
func (Rental) TableName() string        { return "rentals" }
func (Message) TableName() string       { return "messages" }
func (Transaction) TableName() string   { return "transactions" }
