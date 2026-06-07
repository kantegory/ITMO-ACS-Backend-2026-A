package employer

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"vacancy-service/internal/domain"
	"vacancy-service/pkg/apperror"
	"vacancy-service/pkg/slogutil"
)

const component = "employer"

type VacancyRepository interface {
	Create(ctx context.Context, v domain.Vacancy) (*domain.VacancyDetail, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.VacancyDetail, error)
	Update(ctx context.Context, id uuid.UUID, v domain.Vacancy) (*domain.VacancyDetail, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SetPublished(ctx context.Context, id uuid.UUID, published bool) (*domain.VacancyDetail, error)
	List(ctx context.Context, f domain.VacancyFilter) (*domain.PaginatedVacancies, error)
	GetEmployerUserID(ctx context.Context, vacancyID uuid.UUID) (uuid.UUID, error)
}

type ReferenceRepository interface {
	IndustryExists(ctx context.Context, id interface{}) (bool, error)
	ExperienceLevelExists(ctx context.Context, id interface{}) (bool, error)
}

type ProfileClient interface {
	EmployerExists(ctx context.Context, userID uuid.UUID) (bool, error)
	GetCompanyName(ctx context.Context, userID uuid.UUID) (string, error)
}

type EventPublisher interface {
	VacancyPublished(ctx context.Context, vacancyID, employerUserID uuid.UUID, title string) error
}

type UseCase struct {
	vacancies  VacancyRepository
	references ReferenceRepository
	profiles   ProfileClient
	events     EventPublisher
}

func NewUseCase(vacancies VacancyRepository, references ReferenceRepository, profiles ProfileClient, events EventPublisher) *UseCase {
	return &UseCase{vacancies: vacancies, references: references, profiles: profiles, events: events}
}

func (uc *UseCase) ListVacancies(ctx context.Context, userID uuid.UUID, page, limit int) (*domain.PaginatedVacancies, error) {
	return uc.vacancies.List(ctx, domain.VacancyFilter{
		EmployerUserID: &userID,
		Page:           page,
		Limit:          limit,
	})
}

func (uc *UseCase) CreateVacancy(ctx context.Context, userID uuid.UUID, v domain.Vacancy) (*domain.VacancyDetail, error) {
	if v.IndustryID == uuid.Nil || v.ExperienceLevelID == uuid.Nil {
		return nil, apperror.Validation("industry_id and experience_level_id are required")
	}
	if err := uc.validateVacancyRefs(ctx, v.IndustryID, v.ExperienceLevelID); err != nil {
		return nil, err
	}
	if strings.TrimSpace(v.Title) == "" {
		return nil, apperror.Validation("title is required")
	}
	exists, err := uc.profiles.EmployerExists(ctx, userID)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if !exists {
		return nil, apperror.Forbidden("employer profile not found")
	}
	companyName, err := uc.profiles.GetCompanyName(ctx, userID)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	v.EmployerUserID = userID
	v.CompanyName = companyName
	if v.SalaryCurrency == "" {
		v.SalaryCurrency = "RUB"
	}
	return uc.vacancies.Create(ctx, v)
}

func (uc *UseCase) GetVacancy(ctx context.Context, userID, vacancyID uuid.UUID) (*domain.VacancyDetail, error) {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return nil, err
	}
	return uc.vacancies.GetByID(ctx, vacancyID)
}

func (uc *UseCase) UpdateVacancy(ctx context.Context, userID, vacancyID uuid.UUID, v domain.Vacancy) (*domain.VacancyDetail, error) {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return nil, err
	}
	if v.IndustryID != uuid.Nil || v.ExperienceLevelID != uuid.Nil {
		if err := uc.validateVacancyRefs(ctx, v.IndustryID, v.ExperienceLevelID); err != nil {
			return nil, err
		}
	}
	return uc.vacancies.Update(ctx, vacancyID, v)
}

func (uc *UseCase) DeleteVacancy(ctx context.Context, userID, vacancyID uuid.UUID) error {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return err
	}
	return uc.vacancies.Delete(ctx, vacancyID)
}

func (uc *UseCase) Publish(ctx context.Context, userID, vacancyID uuid.UUID) (*domain.VacancyDetail, error) {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return nil, err
	}
	detail, err := uc.vacancies.SetPublished(ctx, vacancyID, true)
	if err != nil {
		return nil, err
	}
	if err := uc.events.VacancyPublished(ctx, detail.ID, detail.EmployerUserID, detail.Title); err != nil {
		slogutil.LogError(ctx, slogutil.LayerUsecase, component, "kafka publish failed", err)
	}
	return detail, nil
}

func (uc *UseCase) Unpublish(ctx context.Context, userID, vacancyID uuid.UUID) (*domain.VacancyDetail, error) {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return nil, err
	}
	return uc.vacancies.SetPublished(ctx, vacancyID, false)
}

func (uc *UseCase) ensureOwner(ctx context.Context, userID, vacancyID uuid.UUID) error {
	ownerID, err := uc.vacancies.GetEmployerUserID(ctx, vacancyID)
	if err != nil {
		return err
	}
	if ownerID != userID {
		return apperror.Forbidden("you do not own this vacancy")
	}
	return nil
}

func (uc *UseCase) validateVacancyRefs(ctx context.Context, industryID, expID uuid.UUID) error {
	if industryID != uuid.Nil {
		ok, err := uc.references.IndustryExists(ctx, industryID)
		if err != nil {
			return apperror.Internal(err)
		}
		if !ok {
			return apperror.Validation("invalid industry_id")
		}
	}
	if expID != uuid.Nil {
		ok, err := uc.references.ExperienceLevelExists(ctx, expID)
		if err != nil {
			return apperror.Internal(err)
		}
		if !ok {
			return apperror.Validation("invalid experience_level_id")
		}
	}
	return nil
}
