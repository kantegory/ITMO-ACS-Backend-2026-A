package candidate

import (
	"context"
	"time"

	"github.com/google/uuid"

	"profile-service/internal/domain"
	"profile-service/pkg/apperror"
)

type UseCase struct {
	candidates CandidateRepository
	resumes    ResumeRepository
}

func NewUseCase(candidates CandidateRepository, resumes ResumeRepository) *UseCase {
	return &UseCase{candidates: candidates, resumes: resumes}
}

func (uc *UseCase) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.Candidate, error) {
	return uc.candidates.GetByUserID(ctx, userID)
}

func (uc *UseCase) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName, phone, city string, birthDate *time.Time) (*domain.Candidate, error) {
	c, err := uc.candidates.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.candidates.UpdateProfile(ctx, c.ID, fullName, phone, city, birthDate)
}

func (uc *UseCase) GetResume(ctx context.Context, userID uuid.UUID) (*domain.ResumeFull, error) {
	c, err := uc.candidates.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.resumes.GetByCandidateID(ctx, c.ID)
}

func (uc *UseCase) UpsertResume(ctx context.Context, userID uuid.UUID, title, summary, skills string) (*domain.ResumeFull, error) {
	c, err := uc.candidates.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if _, err := uc.resumes.Upsert(ctx, c.ID, title, summary, skills); err != nil {
		return nil, err
	}
	return uc.resumes.GetByCandidateID(ctx, c.ID)
}

func (uc *UseCase) AddExperience(ctx context.Context, userID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error) {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.resumes.AddExperience(ctx, resumeID, e)
}

func (uc *UseCase) UpdateExperience(ctx context.Context, userID, expID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error) {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.resumes.UpdateExperience(ctx, expID, resumeID, e)
}

func (uc *UseCase) DeleteExperience(ctx context.Context, userID, expID uuid.UUID) error {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return err
	}
	return uc.resumes.DeleteExperience(ctx, expID, resumeID)
}

func (uc *UseCase) AddEducation(ctx context.Context, userID uuid.UUID, e domain.Education) (*domain.Education, error) {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.resumes.AddEducation(ctx, resumeID, e)
}

func (uc *UseCase) UpdateEducation(ctx context.Context, userID, eduID uuid.UUID, e domain.Education) (*domain.Education, error) {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.resumes.UpdateEducation(ctx, eduID, resumeID, e)
}

func (uc *UseCase) DeleteEducation(ctx context.Context, userID, eduID uuid.UUID) error {
	resumeID, err := uc.resumeIDForUser(ctx, userID)
	if err != nil {
		return err
	}
	return uc.resumes.DeleteEducation(ctx, eduID, resumeID)
}

func (uc *UseCase) resumeIDForUser(ctx context.Context, userID uuid.UUID) (uuid.UUID, error) {
	c, err := uc.candidates.GetByUserID(ctx, userID)
	if err != nil {
		return uuid.Nil, err
	}
	id, err := uc.resumes.GetResumeIDByCandidate(ctx, c.ID)
	if err == nil {
		return id, nil
	}
	if apperror.IsNotFound(err) {
		return uc.resumes.EnsureResume(ctx, c.ID)
	}
	return uuid.Nil, err
}
