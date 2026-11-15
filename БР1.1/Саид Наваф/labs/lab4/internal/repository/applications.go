package repository

import (
"context"
"job-search-api/internal/model"
"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationsRepo struct {
db *pgxpool.Pool
}

func NewApplicationsRepo(db *pgxpool.Pool) *ApplicationsRepo {
return &ApplicationsRepo{db: db}
}

// Create создаёт новый отклик (или возвращает существующий)
func (r *ApplicationsRepo) Create(ctx context.Context, app *model.Application) (*model.Application, error) {
query := `
INSERT INTO applications (vacancy_id, resume_id, status, applied_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (vacancy_id, resume_id) 
DO UPDATE SET status = EXCLUDED.status, applied_at = NOW()
RETURNING id, status, applied_at
`
err := r.db.QueryRow(ctx, query, app.VacancyID, app.ResumeID, app.Status).Scan(&app.ID, &app.Status, &app.AppliedAt)
if err != nil {
return nil, err
}
return app, nil
}

func (r *ApplicationsRepo) ListByApplicant(ctx context.Context, applicantID, limit, offset int) ([]model.Application, error) {
return []model.Application{}, nil
}


func (r *ApplicationsRepo) ListByEmployer(ctx context.Context, employerID, limit, offset int) ([]model.Application, error) {
return []model.Application{}, nil
}


func (r *ApplicationsRepo) GetByID(ctx context.Context, id int) (*model.Application, error) {
return nil, nil
}


func (r *ApplicationsRepo) UpdateStatus(ctx context.Context, appID, employerID int, status string) error {
query := `UPDATE applications SET status = $1 WHERE id = $2`
_, err := r.db.Exec(ctx, query, status, appID)
return err
}


func (r *ApplicationsRepo) GetApplicantIDByResumeID(ctx context.Context, resumeID int) (int, error) {
return 0, nil
}


func (r *ApplicationsRepo) GetEmployerIDByVacancyID(ctx context.Context, vacancyID int) (int, error) {
return 0, nil
}
