package candidate

import (
	"context"
	"time"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
)

type CandidateRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Candidate, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, fullName, phone, city string, birthDate *time.Time) (*domain.Candidate, error)
}

type ResumeRepository interface {
	Upsert(ctx context.Context, candidateID uuid.UUID, title, summary, skills string) (*domain.Resume, error)
	GetByCandidateID(ctx context.Context, candidateID uuid.UUID) (*domain.ResumeFull, error)
	EnsureResume(ctx context.Context, candidateID uuid.UUID) (uuid.UUID, error)
	GetResumeIDByCandidate(ctx context.Context, candidateID uuid.UUID) (uuid.UUID, error)
	AddExperience(ctx context.Context, resumeID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error)
	UpdateExperience(ctx context.Context, id, resumeID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error)
	DeleteExperience(ctx context.Context, id, resumeID uuid.UUID) error
	AddEducation(ctx context.Context, resumeID uuid.UUID, e domain.Education) (*domain.Education, error)
	UpdateEducation(ctx context.Context, id, resumeID uuid.UUID, e domain.Education) (*domain.Education, error)
	DeleteEducation(ctx context.Context, id, resumeID uuid.UUID) error
}
