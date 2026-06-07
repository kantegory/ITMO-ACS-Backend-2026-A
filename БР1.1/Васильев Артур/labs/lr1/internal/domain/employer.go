package domain

import (
	"time"

	"github.com/google/uuid"
)

type Employer struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	CompanyName        string
	CompanyDescription string
	Website            string
	LogoURL            string
	CreatedAt          time.Time
}
