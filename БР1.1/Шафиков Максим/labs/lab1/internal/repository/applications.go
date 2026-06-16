package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"job-search/internal/model"
)

type ApplicationsRepo struct {
	pool *pgxpool.Pool
}

type AppFilter struct {
	VacancyID *uuid.UUID
	Status    *model.ApplicationStatus
	Page      int
	PerPage   int
}

func (r *ApplicationsRepo) getFullApplication(ctx context.Context, id uuid.UUID) (*model.Application, error) {
	var app model.Application

	var vacID, vacCompID uuid.UUID
	var vacCurrCode, vacTitle string
	var vacDesc *string
	var vacSalMin, vacSalMax *int
	var vacExpLevel *model.ExperienceLevel
	var vacFormat model.WorkFormat
	var vacStatus model.VacancyStatus
	var vacCreatedAt, vacUpdatedAt time.Time

	var cID, cUserID uuid.UUID
	var cName string
	var cDesc, cLoc *string
	var cCreatedAt time.Time

	var candID uuid.UUID
	var candEmail string
	var candRole model.UserRole
	var candCreatedAt time.Time

	err := r.pool.QueryRow(ctx, `
		SELECT
			a.id, a.vacancy_id, a.candidate_id, a.resume_id, a.cover_letter, a.status, a.applied_at,
			v.id, v.company_id, v.currency_code, v.title, v.description,
			v.salary_min, v.salary_max, v.experience_level, v.format, v.status, v.created_at, v.updated_at,
			c.id, c.user_id, c.name, c.description, c.location, c.created_at,
			u.id, u.email, u.role, u.created_at
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		JOIN users u ON u.id = a.candidate_id
		WHERE a.id = $1
	`, id).Scan(
		&app.ID, &app.VacancyID, &app.CandidateID, &app.ResumeID, &app.CoverLetter, &app.Status, &app.AppliedAt,
		&vacID, &vacCompID, &vacCurrCode, &vacTitle, &vacDesc,
		&vacSalMin, &vacSalMax, &vacExpLevel, &vacFormat, &vacStatus, &vacCreatedAt, &vacUpdatedAt,
		&cID, &cUserID, &cName, &cDesc, &cLoc, &cCreatedAt,
		&candID, &candEmail, &candRole, &candCreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	company := &model.Company{
		ID:          cID,
		UserID:      cUserID,
		Name:        cName,
		Description: cDesc,
		Location:    cLoc,
		CreatedAt:   cCreatedAt,
	}

	app.Vacancy = &model.Vacancy{
		ID:              vacID,
		CompanyID:       vacCompID,
		CurrencyCode:    vacCurrCode,
		Title:           vacTitle,
		Description:     vacDesc,
		SalaryMin:       vacSalMin,
		SalaryMax:       vacSalMax,
		ExperienceLevel: vacExpLevel,
		Format:          vacFormat,
		Status:          vacStatus,
		CreatedAt:       vacCreatedAt,
		UpdatedAt:       vacUpdatedAt,
		Company:         company,
	}

	app.Candidate = &model.User{
		ID:        candID,
		Email:     candEmail,
		Role:      candRole,
		CreatedAt: candCreatedAt,
	}

	resume, err := (&ResumesRepo{pool: r.pool}).GetByID(ctx, app.ResumeID)
	if err != nil {
		return nil, err
	}
	app.Resume = resume

	return &app, nil
}

func (r *ApplicationsRepo) Create(ctx context.Context, vacancyID, candidateID, resumeID uuid.UUID, coverLetter *string) (*model.Application, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO applications (vacancy_id, candidate_id, resume_id, cover_letter)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id`,
		vacancyID, candidateID, resumeID, coverLetter,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.getFullApplication(ctx, id)
}

func (r *ApplicationsRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Application, error) {
	return r.getFullApplication(ctx, id)
}

func (r *ApplicationsRepo) listApplications(ctx context.Context, baseWhere string, baseArgs []any, filter AppFilter) ([]model.Application, int, error) {
	args := make([]any, len(baseArgs))
	copy(args, baseArgs)
	argN := len(args) + 1

	where := baseWhere
	if filter.VacancyID != nil {
		where += fmt.Sprintf(" AND a.vacancy_id = $%d", argN)
		args = append(args, *filter.VacancyID)
		argN++
	}
	if filter.Status != nil {
		where += fmt.Sprintf(" AND a.status = $%d", argN)
		args = append(args, *filter.Status)
		argN++
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM applications a" + where
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	perPage := filter.PerPage
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	query := fmt.Sprintf(
		`SELECT a.id FROM applications a%s ORDER BY a.applied_at DESC LIMIT $%d OFFSET $%d`,
		where, argN, argN+1,
	)
	args = append(args, perPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, 0, err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	var applications []model.Application
	for _, id := range ids {
		app, err := r.getFullApplication(ctx, id)
		if err != nil {
			return nil, 0, err
		}
		if app != nil {
			applications = append(applications, *app)
		}
	}
	if applications == nil {
		applications = []model.Application{}
	}
	return applications, total, nil
}

func (r *ApplicationsRepo) ListByCandidate(ctx context.Context, candidateID uuid.UUID, filter AppFilter) ([]model.Application, int, error) {
	return r.listApplications(ctx,
		" WHERE a.candidate_id = $1",
		[]any{candidateID},
		filter,
	)
}

func (r *ApplicationsRepo) ListByCompany(ctx context.Context, companyID uuid.UUID, filter AppFilter) ([]model.Application, int, error) {
	return r.listApplications(ctx,
		" JOIN vacancies v ON v.id = a.vacancy_id WHERE v.company_id = $1",
		[]any{companyID},
		filter,
	)
}

func (r *ApplicationsRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status model.ApplicationStatus) (*model.Application, error) {
	_, err := r.pool.Exec(ctx,
		`UPDATE applications SET status = $1 WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return nil, err
	}
	return r.getFullApplication(ctx, id)
}

func (r *ApplicationsRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM applications WHERE id = $1`, id)
	return err
}

func (r *ApplicationsRepo) GetByVacancyAndCandidate(ctx context.Context, vacancyID, candidateID uuid.UUID) (*model.Application, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT id FROM applications WHERE vacancy_id = $1 AND candidate_id = $2`,
		vacancyID, candidateID,
	).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return r.getFullApplication(ctx, id)
}
