package engagementrepo

import "time"

type commentRow struct {
	ID              uint64  `gorm:"primaryKey"`
	AuthorID        uint64  `gorm:"index;not null"`
	TargetType      string  `gorm:"index;not null;size:16"`
	TargetID        uint64  `gorm:"index;not null"`
	ParentCommentID *uint64 `gorm:"index"`
	Content         string  `gorm:"not null;type:text"`
	CreatedAt       time.Time
}

func (commentRow) TableName() string {
	return commentsTable
}

type recipeLikeRow struct {
	UserID   uint64 `gorm:"primaryKey"`
	RecipeID uint64 `gorm:"primaryKey"`
}

func (recipeLikeRow) TableName() string {
	return recipeLikesTable
}

type postLikeRow struct {
	UserID uint64 `gorm:"primaryKey"`
	PostID uint64 `gorm:"primaryKey"`
}

func (postLikeRow) TableName() string {
	return postLikesTable
}

type savedRecipeRow struct {
	UserID    uint64    `gorm:"primaryKey"`
	RecipeID  uint64    `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (savedRecipeRow) TableName() string {
	return savedRecipesTable
}

type outboxEventRow struct {
	EventID       string `gorm:"primaryKey;size:64"`
	EventType     string `gorm:"not null;size:128;index"`
	OccurredAt    time.Time
	Payload       []byte `gorm:"not null;type:jsonb"`
	ClaimedAt     *time.Time
	PublishedAt   *time.Time
	NextAttemptAt *time.Time
	Attempts      int
	LastError     *string `gorm:"type:text"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (outboxEventRow) TableName() string {
	return outboxEventsTable
}
