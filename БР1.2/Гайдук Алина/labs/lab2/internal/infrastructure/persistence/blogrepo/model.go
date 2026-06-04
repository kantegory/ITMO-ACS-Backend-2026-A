package blogrepo

import "time"

type postRow struct {
	ID            uint64  `gorm:"primaryKey"`
	AuthorID      uint64  `gorm:"index;not null"`
	Title         string  `gorm:"not null;size:255"`
	Content       string  `gorm:"not null;type:text"`
	CoverImageURL *string `gorm:"size:512"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (postRow) TableName() string {
	return postsTable
}
