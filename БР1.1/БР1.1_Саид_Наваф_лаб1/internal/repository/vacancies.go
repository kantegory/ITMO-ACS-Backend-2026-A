package repository

import (
	"context"
	"job-search-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VacanciesRepo struct {
	db *pgxpool.Pool
}

func NewVacanciesRepo(db *pgxpool.Pool) *VacanciesRepo {
	return &VacanciesRepo{db: db}
}


func (r *VacanciesRepo) Create(ctx context.Context, v *model.Vacancy) (*model.Vacancy, error) {
	query := `
		INSERT INTO vacancies (
			employer_id, category_id, title, description, requirements,
			working_conditions, salary_min, salary_max, experience_required,
			city, address, is_active, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
		)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(ctx, query,
		v.EmployerID, v.CategoryID, v.Title, v.Description, v.Requirements,
		v.WorkingConditions, v.SalaryMin, v.SalaryMax, v.ExperienceRequired,
		v.City, v.Address, v.IsActive,
	).Scan(&v.ID, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return v, nil
}


func (r *VacanciesRepo) List(ctx context.Context, limit, offset int) ([]model.Vacancy, error) {
	query := `
		SELECT id, employer_id, category_id, title, description, requirements,
		       working_conditions, salary_min, salary_max, experience_required,
		       city, address, is_active, created_at
		FROM vacancies
		WHERE is_active = TRUE
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vacancies []model.Vacancy
	for rows.Next() {
		var v model.Vacancy
		err := rows.Scan(&v.ID, &v.EmployerID, &v.CategoryID, &v.Title, &v.Description,
			&v.Requirements, &v.WorkingConditions, &v.SalaryMin, &v.SalaryMax,
			&v.ExperienceRequired, &v.City, &v.Address, &v.IsActive, &v.CreatedAt)
		if err != nil {
			return nil, err
		}
		vacancies = append(vacancies, v)
	}
	return vacancies, nil
}


func (r *VacanciesRepo) GetByID(ctx context.Context, id int) (*model.Vacancy, error) {
	query := `
		SELECT id, employer_id, category_id, title, description, requirements,
		       working_conditions, salary_min, salary_max, experience_required,
		       city, address, is_active, created_at
		FROM vacancies WHERE id = $1
	`
	var v model.Vacancy
	err := r.db.QueryRow(ctx, query, id).Scan(
		&v.ID, &v.EmployerID, &v.CategoryID, &v.Title, &v.Description,
		&v.Requirements, &v.WorkingConditions, &v.SalaryMin, &v.SalaryMax,
		&v.ExperienceRequired, &v.City, &v.Address, &v.IsActive, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}


func (r *VacanciesRepo) Update(ctx context.Context, id, employerID int, v *model.Vacancy) error {
	query := `
		UPDATE vacancies SET
			title = $1, description = $2, requirements = $3,
			working_conditions = $4, salary_min = $5, salary_max = $6,
			experience_required = $7, city = $8, address = $9,
			category_id = $10
		WHERE id = $11 AND employer_id = $12
	`
	_, err := r.db.Exec(ctx, query,
		v.Title, v.Description, v.Requirements, v.WorkingConditions,
		v.SalaryMin, v.SalaryMax, v.ExperienceRequired, v.City, v.Address,
		v.CategoryID, id, employerID)
	return err
}


func (r *VacanciesRepo) Delete(ctx context.Context, id, employerID int) error {
	query := `UPDATE vacancies SET is_active = FALSE WHERE id = $1 AND employer_id = $2`
	_, err := r.db.Exec(ctx, query, id, employerID)
	return err
}