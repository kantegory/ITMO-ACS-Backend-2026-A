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

type postStatsRow struct {
	PostID        uint64 `gorm:"primaryKey"`
	LikesCount    int64  `gorm:"not null;default:0"`
	CommentsCount int64  `gorm:"not null;default:0"`
	UpdatedAt     time.Time
}

func (postStatsRow) TableName() string {
	return postStatsTable
}

type processedEventRow struct {
	EventID   string `gorm:"primaryKey;size:64"`
	EventType string `gorm:"not null;size:128"`
	CreatedAt time.Time
}

func (processedEventRow) TableName() string {
	return processedEventsTable
}
