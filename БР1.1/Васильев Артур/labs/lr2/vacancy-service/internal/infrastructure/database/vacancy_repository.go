package database

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"vacancy-service/internal/domain"
	"vacancy-service/pkg/apperror"
	"vacancy-service/pkg/slogutil"
)

const vacancyRepoComponent = "vacancy_repository"

type VacancyRepository struct {
	pool *pgxpool.Pool
}

func NewVacancyRepository(pool *pgxpool.Pool) *VacancyRepository {
	return &VacancyRepository{pool: pool}
}

const vacancySelectBase = `
	SELECT v.id, v.employer_user_id, v.industry_id, v.experience_level_id,
		v.title, v.description, v.requirements,
		v.salary_from, v.salary_to, v.salary_currency, v.location, v.company_name,
		v.is_published, v.created_at, v.updated_at,
		i.id, i.name, i.slug,
		el.id, el.name, el.slug, el.min_years, el.max_years
	FROM vacancies v
	JOIN industries i ON i.id = v.industry_id
	JOIN experience_levels el ON el.id = v.experience_level_id`

func scanVacancyListItem(row pgx.Row) (domain.VacancyListItem, error) {
	var item domain.VacancyListItem
	var location pgtype.Text
	err := row.Scan(
		&item.ID, &item.EmployerUserID, &item.IndustryID, &item.ExperienceLevelID,
		&item.Title, &item.Description, &item.Requirements,
		&item.SalaryFrom, &item.SalaryTo, &item.SalaryCurrency, &location, &item.CompanyName,
		&item.IsPublished, &item.CreatedAt, &item.UpdatedAt,
		&item.Industry.ID, &item.Industry.Name, &item.Industry.Slug,
		&item.ExperienceLevel.ID, &item.ExperienceLevel.Name, &item.ExperienceLevel.Slug,
		&item.ExperienceLevel.MinYears, &item.ExperienceLevel.MaxYears,
	)
	if err != nil {
		return item, err
	}
	item.Location = textFromNullable(location)
	return item, nil
}

func (r *VacancyRepository) Create(ctx context.Context, v domain.Vacancy) (*domain.VacancyDetail, error) {
	const q = `
		INSERT INTO vacancies (
			employer_user_id, industry_id, experience_level_id,
			title, description, requirements,
			salary_from, salary_to, salary_currency, location, company_name, is_published
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		RETURNING id`
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, q,
		v.EmployerUserID, v.IndustryID, v.ExperienceLevelID,
		v.Title, v.Description, v.Requirements,
		v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.Location, v.CompanyName, v.IsPublished,
	).Scan(&id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return nil, apperror.Validation("invalid industry_id or experience_level_id")
		}
		slogutil.LogError(ctx, slogutil.LayerRepository, vacancyRepoComponent, "insert vacancy failed", err)
		return nil, apperror.Internal(err)
	}
	return r.GetByID(ctx, id)
}

func (r *VacancyRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.VacancyDetail, error) {
	q := vacancySelectBase + ` WHERE v.id = $1`
	item, err := scanVacancyListItem(r.pool.QueryRow(ctx, q, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("vacancy not found")
		}
		return nil, apperror.Internal(err)
	}
	return &domain.VacancyDetail{
		VacancyListItem: item,
		Employer: domain.EmployerInfo{
			UserID:      item.EmployerUserID,
			CompanyName: item.CompanyName,
		},
	}, nil
}

func (r *VacancyRepository) Update(ctx context.Context, id uuid.UUID, v domain.Vacancy) (*domain.VacancyDetail, error) {
	const q = `
		UPDATE vacancies SET
			industry_id = COALESCE($2, industry_id),
			experience_level_id = COALESCE($3, experience_level_id),
			title = COALESCE(NULLIF($4,''), title),
			description = COALESCE(NULLIF($5,''), description),
			requirements = COALESCE(NULLIF($6,''), requirements),
			salary_from = $7,
			salary_to = $8,
			salary_currency = COALESCE(NULLIF($9,''), salary_currency),
			location = $10,
			is_published = COALESCE($11, is_published),
			updated_at = NOW()
		WHERE id = $1`
	var industryID, expID interface{} = v.IndustryID, v.ExperienceLevelID
	if v.IndustryID == uuid.Nil {
		industryID = nil
	}
	if v.ExperienceLevelID == uuid.Nil {
		expID = nil
	}
	tag, err := r.pool.Exec(ctx, q, id, industryID, expID,
		v.Title, v.Description, v.Requirements,
		v.SalaryFrom, v.SalaryTo, v.SalaryCurrency, v.Location, v.IsPublished,
	)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, apperror.NotFound("vacancy not found")
	}
	return r.GetByID(ctx, id)
}

func (r *VacancyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM vacancies WHERE id = $1`, id)
	if err != nil {
		return apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return apperror.NotFound("vacancy not found")
	}
	return nil
}

func (r *VacancyRepository) SetPublished(ctx context.Context, id uuid.UUID, published bool) (*domain.VacancyDetail, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE vacancies SET is_published = $2, updated_at = NOW() WHERE id = $1`, id, published)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return nil, apperror.NotFound("vacancy not found")
	}
	return r.GetByID(ctx, id)
}

func (r *VacancyRepository) List(ctx context.Context, f domain.VacancyFilter) (*domain.PaginatedVacancies, error) {
	var conds []string
	var args []any
	n := 1

	if f.OnlyPublished {
		conds = append(conds, "v.is_published = TRUE")
	}
	if f.EmployerUserID != nil {
		conds = append(conds, fmt.Sprintf("v.employer_user_id = $%d", n))
		args = append(args, *f.EmployerUserID)
		n++
	}
	if f.IndustryID != nil {
		conds = append(conds, fmt.Sprintf("v.industry_id = $%d", n))
		args = append(args, *f.IndustryID)
		n++
	}
	if f.ExperienceLevelID != nil {
		conds = append(conds, fmt.Sprintf("v.experience_level_id = $%d", n))
		args = append(args, *f.ExperienceLevelID)
		n++
	}
	if f.SalaryMin != nil {
		conds = append(conds, fmt.Sprintf("(v.salary_to IS NULL OR v.salary_to >= $%d OR v.salary_from >= $%d)", n, n))
		args = append(args, *f.SalaryMin)
		n++
	}
	if f.Query != "" {
		conds = append(conds, fmt.Sprintf("v.title ILIKE $%d", n))
		args = append(args, "%"+f.Query+"%")
		n++
	}

	where := ""
	if len(conds) > 0 {
		where = " WHERE " + strings.Join(conds, " AND ")
	}

	countQ := `SELECT COUNT(*) FROM vacancies v` + where
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, apperror.Internal(err)
	}

	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
	offset := (f.Page - 1) * f.Limit

	listQ := vacancySelectBase + where + fmt.Sprintf(" ORDER BY v.created_at DESC LIMIT $%d OFFSET $%d", n, n+1)
	args = append(args, f.Limit, offset)

	rows, err := r.pool.Query(ctx, listQ, args...)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	defer rows.Close()

	var items []domain.VacancyListItem
	for rows.Next() {
		item, err := scanVacancyListItem(rows)
		if err != nil {
			return nil, apperror.Internal(err)
		}
		items = append(items, item)
	}

	return &domain.PaginatedVacancies{Items: items, Total: total, Page: f.Page, Limit: f.Limit}, nil
}

func (r *VacancyRepository) GetEmployerUserID(ctx context.Context, vacancyID uuid.UUID) (uuid.UUID, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT employer_user_id FROM vacancies WHERE id = $1`, vacancyID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, apperror.NotFound("vacancy not found")
		}
		return uuid.Nil, apperror.Internal(err)
	}
	return id, nil
}
