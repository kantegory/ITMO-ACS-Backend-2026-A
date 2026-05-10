package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"job-search/internal/model"
)

type VacanciesRepo struct {
	pool *pgxpool.Pool
}

type VacancyFilter struct {
	Industry        *uuid.UUID
	CompanyID       *uuid.UUID
	MinSalary       *int
	MaxSalary       *int
	ExperienceLevel *model.ExperienceLevel
	Format          *model.WorkFormat
	Status          *model.VacancyStatus
	SearchQuery     string
	Page            int
	PerPage         int
}

func (r *VacanciesRepo) loadSkills(ctx context.Context, vacancyID uuid.UUID) ([]model.Skill, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name FROM skills s
		 JOIN vacancy_skills vs ON vs.skill_id = s.id
		 WHERE vs.vacancy_id = $1
		 ORDER BY s.name`,
		vacancyID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []model.Skill
	for rows.Next() {
		var s model.Skill
		if err := rows.Scan(&s.ID, &s.Name); err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	if skills == nil {
		skills = []model.Skill{}
	}
	return skills, rows.Err()
}

func (r *VacanciesRepo) scanVacancy(_ context.Context, rows pgx.Rows) (*model.Vacancy, error) {
	var v model.Vacancy
	var cID, cUserID uuid.UUID
	var cIndID *uuid.UUID
	var cIndName *string
	var cName string
	var cDesc, cLoc *string
	var cCreatedAt time.Time
	var vacIndID *uuid.UUID
	var vacIndName *string

	err := rows.Scan(
		&v.ID, &v.CompanyID, &v.IndustryID, &v.CurrencyCode, &v.Title,
		&v.Description, &v.SalaryMin, &v.SalaryMax, &v.ExperienceLevel, &v.Format, &v.Status,
		&v.CreatedAt, &v.UpdatedAt,
		&cID, &cUserID, &cIndID, &cName, &cDesc, &cLoc, &cCreatedAt,
		&vacIndID, &vacIndName,
	)
	if err != nil {
		return nil, err
	}

	comp := &model.Company{
		ID:          cID,
		UserID:      cUserID,
		Name:        cName,
		Description: cDesc,
		Location:    cLoc,
		CreatedAt:   cCreatedAt,
	}
	if cIndID != nil && cIndName != nil {
		comp.Industry = &model.Industry{ID: *cIndID, Name: *cIndName}
	}
	v.Company = comp

	if vacIndID != nil && vacIndName != nil {
		v.Industry = &model.Industry{ID: *vacIndID, Name: *vacIndName}
	}

	return &v, nil
}

const vacancySelectBase = `
	SELECT v.id, v.company_id, v.industry_id, v.currency_code, v.title,
	       v.description, v.salary_min, v.salary_max, v.experience_level, v.format, v.status,
	       v.created_at, v.updated_at,
	       c.id, c.user_id, ci.id, c.name, c.description, c.location, c.created_at,
	       vi.id, vi.name
	FROM vacancies v
	JOIN companies c ON c.id = v.company_id
	LEFT JOIN industries ci ON ci.id = c.industry_id
	LEFT JOIN industries vi ON vi.id = v.industry_id`

func (r *VacanciesRepo) List(ctx context.Context, filter VacancyFilter) ([]model.Vacancy, int, error) {
	args := []any{}
	argN := 1

	where := " WHERE 1=1"

	if filter.Status != nil {
		where += fmt.Sprintf(" AND v.status = $%d", argN)
		args = append(args, *filter.Status)
		argN++
	} else {
		where += " AND v.status = 'active'"
	}

	if filter.Industry != nil {
		where += fmt.Sprintf(" AND v.industry_id = $%d", argN)
		args = append(args, *filter.Industry)
		argN++
	}

	if filter.CompanyID != nil {
		where += fmt.Sprintf(" AND v.company_id = $%d", argN)
		args = append(args, *filter.CompanyID)
		argN++
	}

	if filter.MinSalary != nil {
		where += fmt.Sprintf(" AND (v.salary_min IS NULL OR v.salary_min >= $%d)", argN)
		args = append(args, *filter.MinSalary)
		argN++
	}

	if filter.MaxSalary != nil {
		where += fmt.Sprintf(" AND (v.salary_max IS NULL OR v.salary_max <= $%d)", argN)
		args = append(args, *filter.MaxSalary)
		argN++
	}

	if filter.ExperienceLevel != nil {
		where += fmt.Sprintf(" AND v.experience_level = $%d", argN)
		args = append(args, *filter.ExperienceLevel)
		argN++
	}

	if filter.Format != nil {
		where += fmt.Sprintf(" AND v.format = $%d", argN)
		args = append(args, *filter.Format)
		argN++
	}

	if filter.SearchQuery != "" {
		where += fmt.Sprintf(" AND (v.title ILIKE $%d OR v.description ILIKE $%d)", argN, argN)
		args = append(args, "%"+filter.SearchQuery+"%")
		argN++
	}

	// Count query
	countQuery := "SELECT COUNT(*) FROM vacancies v" + where
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Pagination
	page := filter.Page
	if page < 1 {
		page = 1
	}
	perPage := filter.PerPage
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	query := vacancySelectBase + where +
		fmt.Sprintf(" ORDER BY v.created_at DESC LIMIT $%d OFFSET $%d", argN, argN+1)
	args = append(args, perPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		v, err := r.scanVacancy(ctx, rows)
		if err != nil {
			return nil, 0, err
		}
		vacancies = append(vacancies, *v)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	for i := range vacancies {
		skills, err := r.loadSkills(ctx, vacancies[i].ID)
		if err != nil {
			return nil, 0, err
		}
		vacancies[i].Skills = skills
	}

	if vacancies == nil {
		vacancies = []model.Vacancy{}
	}
	return vacancies, total, nil
}

func (r *VacanciesRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Vacancy, error) {
	query := vacancySelectBase + " WHERE v.id = $1"
	rows, err := r.pool.Query(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, nil
	}

	v, err := r.scanVacancy(ctx, rows)
	if err != nil {
		return nil, err
	}

	skills, err := r.loadSkills(ctx, v.ID)
	if err != nil {
		return nil, err
	}
	v.Skills = skills
	return v, nil
}

type VacancyCreateRequest struct {
	Title           string
	Description     *string
	IndustryID      *uuid.UUID
	CurrencyCode    string
	SalaryMin       *int
	SalaryMax       *int
	ExperienceLevel *model.ExperienceLevel
	Format          model.WorkFormat
	Status          model.VacancyStatus
	SkillIDs        []uuid.UUID
}

func (r *VacanciesRepo) Create(ctx context.Context, companyID uuid.UUID, req VacancyCreateRequest) (*model.Vacancy, error) {
	currCode := req.CurrencyCode
	if currCode == "" {
		currCode = "RUB"
	}
	format := req.Format
	if format == "" {
		format = model.FormatOffice
	}
	status := req.Status
	if status == "" {
		status = model.VacancyDraft
	}

	var vacID uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO vacancies (company_id, industry_id, currency_code, title, description,
		                        salary_min, salary_max, experience_level, format, status)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id`,
		companyID, req.IndustryID, currCode, req.Title, req.Description,
		req.SalaryMin, req.SalaryMax, req.ExperienceLevel, format, status,
	).Scan(&vacID)
	if err != nil {
		return nil, err
	}

	for _, sid := range req.SkillIDs {
		if _, err := r.pool.Exec(ctx,
			`INSERT INTO vacancy_skills (vacancy_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			vacID, sid,
		); err != nil {
			return nil, err
		}
	}

	return r.GetByID(ctx, vacID)
}

type VacancyUpdateRequest struct {
	Title           *string
	Description     *string
	IndustryID      *uuid.UUID
	CurrencyCode    *string
	SalaryMin       *int
	SalaryMax       *int
	ExperienceLevel *model.ExperienceLevel
	Format          *model.WorkFormat
	Status          *model.VacancyStatus
	SkillIDs        []uuid.UUID
	SkillIDsSet     bool
}

func (r *VacanciesRepo) Update(ctx context.Context, id uuid.UUID, req VacancyUpdateRequest) (*model.Vacancy, error) {
	setParts := []string{}
	args := []any{}
	n := 1

	if req.Title != nil {
		setParts = append(setParts, fmt.Sprintf("title = $%d", n))
		args = append(args, *req.Title)
		n++
	}
	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", n))
		args = append(args, *req.Description)
		n++
	}
	if req.IndustryID != nil {
		setParts = append(setParts, fmt.Sprintf("industry_id = $%d", n))
		args = append(args, *req.IndustryID)
		n++
	}
	if req.CurrencyCode != nil {
		setParts = append(setParts, fmt.Sprintf("currency_code = $%d", n))
		args = append(args, *req.CurrencyCode)
		n++
	}
	if req.SalaryMin != nil {
		setParts = append(setParts, fmt.Sprintf("salary_min = $%d", n))
		args = append(args, *req.SalaryMin)
		n++
	}
	if req.SalaryMax != nil {
		setParts = append(setParts, fmt.Sprintf("salary_max = $%d", n))
		args = append(args, *req.SalaryMax)
		n++
	}
	if req.ExperienceLevel != nil {
		setParts = append(setParts, fmt.Sprintf("experience_level = $%d", n))
		args = append(args, *req.ExperienceLevel)
		n++
	}
	if req.Format != nil {
		setParts = append(setParts, fmt.Sprintf("format = $%d", n))
		args = append(args, *req.Format)
		n++
	}
	if req.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = $%d", n))
		args = append(args, *req.Status)
		n++
	}

	if len(setParts) > 0 {
		setParts = append(setParts, "updated_at = now()")
		query := "UPDATE vacancies SET " + strings.Join(setParts, ", ") + fmt.Sprintf(" WHERE id = $%d", n)
		args = append(args, id)
		if _, err := r.pool.Exec(ctx, query, args...); err != nil {
			return nil, err
		}
	}

	if req.SkillIDsSet {
		if _, err := r.pool.Exec(ctx,
			`DELETE FROM vacancy_skills WHERE vacancy_id = $1`, id,
		); err != nil {
			return nil, err
		}
		for _, sid := range req.SkillIDs {
			if _, err := r.pool.Exec(ctx,
				`INSERT INTO vacancy_skills (vacancy_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				id, sid,
			); err != nil {
				return nil, err
			}
		}
	}

	return r.GetByID(ctx, id)
}

func (r *VacanciesRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM vacancies WHERE id = $1`, id)
	return err
}

func (r *VacanciesRepo) GetCompanyIDByVacancyID(ctx context.Context, id uuid.UUID) (uuid.UUID, error) {
	var companyID uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT company_id FROM vacancies WHERE id = $1`, id,
	).Scan(&companyID)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, nil
	}
	return companyID, err
}
