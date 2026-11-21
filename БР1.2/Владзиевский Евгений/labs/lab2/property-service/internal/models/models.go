package models

import "time"

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

type Property struct {
	ID          uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerID     uint            `gorm:"not null;index" json:"owner_id"`
	TypeID      *uint           `json:"type_id"`
	Type        PropertyType    `gorm:"foreignKey:TypeID;constraint:OnDelete:SET NULL" json:"type,omitempty"`
	Title       string          `gorm:"type:varchar(255);not null" json:"title"`
	Description *string         `gorm:"type:text" json:"description,omitempty"`
	PricePerDay float64         `gorm:"type:decimal(12,2);not null;check:price_per_day > 0" json:"price_per_day"`
	City        string          `gorm:"type:varchar(100);not null;index" json:"city"`
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
	PropertyID uint   `gorm:"not null;index" json:"property_id"`
	ImageURL   string `gorm:"type:text;not null" json:"image_url"`
	IsMain     bool   `gorm:"default:false" json:"is_main"`
}

func (PropertyType) TableName() string  { return "property_types" }
func (Amenity) TableName() string       { return "amenities" }
func (Property) TableName() string      { return "properties" }
func (PropertyImage) TableName() string { return "property_images" }