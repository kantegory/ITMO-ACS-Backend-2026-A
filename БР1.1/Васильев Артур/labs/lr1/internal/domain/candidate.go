package domain

import (
	"time"

	"github.com/google/uuid"
)

type Candidate struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FullName  string
	Phone     string
	City      string
	BirthDate *time.Time
	CreatedAt time.Time
}

type Resume struct {
	ID          uuid.UUID
	CandidateID uuid.UUID
	Title       string
	Summary     string
	Skills      string
	UpdatedAt   time.Time
}

type WorkExperience struct {
	ID          uuid.UUID
	ResumeID    uuid.UUID
	CompanyName string
	Position    string
	StartDate   time.Time
	EndDate     *time.Time
	Description string
	SortOrder   int
}

type Education struct {
	ID             uuid.UUID
	ResumeID       uuid.UUID
	Institution    string
	Degree         string
	GraduationYear int
	SortOrder      int
}

type ResumeFull struct {
	Resume
	Experiences []WorkExperience
	Educations  []Education
}
