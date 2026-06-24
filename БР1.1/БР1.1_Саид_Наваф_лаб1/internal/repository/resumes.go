package repository

import (
"context"
"job-search-api/internal/model"
"github.com/jackc/pgx/v5/pgxpool"
)

type ResumesRepo struct {
db *pgxpool.Pool
}

func NewResumesRepo(db *pgxpool.Pool) *ResumesRepo {
return &ResumesRepo{db: db}
}

func (r *ResumesRepo) Create(ctx context.Context, resume *model.Resume) (*model.Resume, error) {
query := `
INSERT INTO resumes (
applicant_id, desired_position, expected_salary, experience,
about, is_active, created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW())
RETURNING id, created_at
`
err := r.db.QueryRow(ctx, query,
resume.ApplicantID, resume.DesiredPosition, resume.ExpectedSalary,
resume.Experience, resume.About, resume.IsActive,
).Scan(&resume.ID, &resume.CreatedAt)
if err != nil {
return nil, err
}
return resume, nil
}


func (r *ResumesRepo) List(ctx context.Context, limit, offset int) ([]model.Resume, error) {
query := `
SELECT id, applicant_id, desired_position, expected_salary, experience,
       about, is_active, created_at
FROM resumes
WHERE is_active = TRUE
ORDER BY created_at DESC
LIMIT $1 OFFSET $2
`
rows, err := r.db.Query(ctx, query, limit, offset)
if err != nil {
return nil, err
}
defer rows.Close()

var resumes []model.Resume
for rows.Next() {
var r model.Resume
err := rows.Scan(&r.ID, &r.ApplicantID, &r.DesiredPosition, &r.ExpectedSalary,
&r.Experience, &r.About, &r.IsActive, &r.CreatedAt)
if err != nil {
return nil, err
}
resumes = append(resumes, r)
}
return resumes, nil
}


func (r *ResumesRepo) GetByID(ctx context.Context, id int) (*model.Resume, error) {
query := `
SELECT id, applicant_id, desired_position, expected_salary, experience,
       about, is_active, created_at
FROM resumes WHERE id = $1
`
var resume model.Resume
err := r.db.QueryRow(ctx, query, id).Scan(
&resume.ID, &resume.ApplicantID, &resume.DesiredPosition, &resume.ExpectedSalary,
&resume.Experience, &resume.About, &resume.IsActive, &resume.CreatedAt)
if err != nil {
return nil, err
}
return &resume, nil
}

func (r *ResumesRepo) Update(ctx context.Context, id, applicantID int, resume *model.Resume) error {
query := `
UPDATE resumes SET
desired_position = $1, expected_salary = $2, experience = $3,
about = $4, is_active = $5
WHERE id = $6 AND applicant_id = $7
`
_, err := r.db.Exec(ctx, query,
resume.DesiredPosition, resume.ExpectedSalary, resume.Experience,
resume.About, resume.IsActive, id, applicantID)
return err
}


func (r *ResumesRepo) Delete(ctx context.Context, id, applicantID int) error {
query := `UPDATE resumes SET is_active = FALSE WHERE id = $1 AND applicant_id = $2`
_, err := r.db.Exec(ctx, query, id, applicantID)
return err
}


func (r *ResumesRepo) GetApplicantIDByUserID(ctx context.Context, userID int) (int, error) {
var applicantID int
err := r.db.QueryRow(ctx, "SELECT id FROM applicants WHERE user_id = $1", userID).Scan(&applicantID)
return applicantID, err
}

func (r *ResumesRepo) CreateApplicantIfNeeded(ctx context.Context, userID int, firstName, lastName string) (int, error) {
var applicantID int
err := r.db.QueryRow(ctx,
"INSERT INTO applicants (user_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name RETURNING id",
userID, firstName, lastName,
).Scan(&applicantID)
return applicantID, err
}
