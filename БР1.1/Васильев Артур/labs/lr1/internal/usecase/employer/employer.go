package employer

import (
	"context"
	"strings"

	"github.com/google/uuid"

	"jobsearch/internal/domain"
	"jobsearch/pkg/apperror"
)

type UseCase struct {
	employers  EmployerRepository
	vacancies  VacancyRepository
	references ReferenceRepository
}

func NewUseCase(employers EmployerRepository, vacancies VacancyRepository, references ReferenceRepository) *UseCase {
	return &UseCase{employers: employers, vacancies: vacancies, references: references}
}

func (uc *UseCase) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.Employer, error) {
	return uc.employers.GetByUserID(ctx, userID)
}

func (uc *UseCase) UpdateProfile(ctx context.Context, userID uuid.UUID, companyName, desc, website, logo string) (*domain.Employer, error) {
	e, err := uc.employers.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.employers.UpdateProfile(ctx, e.ID, companyName, desc, website, logo)
}

func (uc *UseCase) ListVacancies(ctx context.Context, userID uuid.UUID, page, limit int) (*domain.PaginatedVacancies, error) {
	e, err := uc.employers.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.vacancies.List(ctx, domain.VacancyFilter{
		EmployerID: &e.ID,
		Page:       page,
		Limit:      limit,
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
	e, err := uc.employers.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	v.EmployerID = e.ID
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
	return uc.vacancies.SetPublished(ctx, vacancyID, true)
}

func (uc *UseCase) Unpublish(ctx context.Context, userID, vacancyID uuid.UUID) (*domain.VacancyDetail, error) {
	if err := uc.ensureOwner(ctx, userID, vacancyID); err != nil {
		return nil, err
	}
	return uc.vacancies.SetPublished(ctx, vacancyID, false)
}

func (uc *UseCase) ensureOwner(ctx context.Context, userID, vacancyID uuid.UUID) error {
	e, err := uc.employers.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}
	ownerID, err := uc.vacancies.GetEmployerID(ctx, vacancyID)
	if err != nil {
		return err
	}
	if ownerID != e.ID {
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
