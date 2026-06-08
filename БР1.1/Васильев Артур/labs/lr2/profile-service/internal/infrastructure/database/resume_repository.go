package database

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"profile-service/internal/domain"
	"profile-service/pkg/apperror"
)

type ResumeRepository struct {
	pool *pgxpool.Pool
}

func NewResumeRepository(pool *pgxpool.Pool) *ResumeRepository {
	return &ResumeRepository{pool: pool}
}

func (r *ResumeRepository) Upsert(ctx context.Context, candidateID uuid.UUID, title, summary, skills string) (*domain.Resume, error) {
	const q = `
		INSERT INTO resumes (candidate_id, title, summary, skills)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (candidate_id) DO UPDATE SET
			title = EXCLUDED.title,
			summary = EXCLUDED.summary,
			skills = EXCLUDED.skills,
			updated_at = NOW()
		RETURNING id, candidate_id, title, summary, skills, updated_at`
	var res domain.Resume
	var summaryCol, skillsCol pgtype.Text
	err := r.pool.QueryRow(ctx, q, candidateID, title, summary, skills).Scan(
		&res.ID, &res.CandidateID, &res.Title, &summaryCol, &skillsCol, &res.UpdatedAt,
	)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	res.Summary = textFromNullable(summaryCol)
	res.Skills = textFromNullable(skillsCol)
	return &res, nil
}

func (r *ResumeRepository) GetByCandidateID(ctx context.Context, candidateID uuid.UUID) (*domain.ResumeFull, error) {
	const qResume = `SELECT id, candidate_id, title, summary, skills, updated_at FROM resumes WHERE candidate_id = $1`
	var res domain.Resume
	var summaryCol, skillsCol pgtype.Text
	err := r.pool.QueryRow(ctx, qResume, candidateID).Scan(
		&res.ID, &res.CandidateID, &res.Title, &summaryCol, &skillsCol, &res.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("resume not found")
		}
		return nil, apperror.Internal(err)
	}
	res.Summary = textFromNullable(summaryCol)
	res.Skills = textFromNullable(skillsCol)

	full := &domain.ResumeFull{Resume: res}

	const qExp = `
		SELECT id, resume_id, company_name, position, start_date, end_date, description, sort_order
		FROM work_experiences WHERE resume_id = $1 ORDER BY sort_order, start_date DESC`
	rows, err := r.pool.Query(ctx, qExp, res.ID)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var e domain.WorkExperience
		var desc pgtype.Text
		if err := rows.Scan(&e.ID, &e.ResumeID, &e.CompanyName, &e.Position, &e.StartDate, &e.EndDate, &desc, &e.SortOrder); err != nil {
			return nil, apperror.Internal(err)
		}
		e.Description = textFromNullable(desc)
		full.Experiences = append(full.Experiences, e)
	}

	const qEdu = `
		SELECT id, resume_id, institution, degree, graduation_year, sort_order
		FROM educations WHERE resume_id = $1 ORDER BY sort_order, graduation_year DESC`
	rowsEdu, err := r.pool.Query(ctx, qEdu, res.ID)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	defer rowsEdu.Close()
	for rowsEdu.Next() {
		var e domain.Education
		if err := rowsEdu.Scan(&e.ID, &e.ResumeID, &e.Institution, &e.Degree, &e.GraduationYear, &e.SortOrder); err != nil {
			return nil, apperror.Internal(err)
		}
		full.Educations = append(full.Educations, e)
	}

	return full, nil
}

func (r *ResumeRepository) EnsureResume(ctx context.Context, candidateID uuid.UUID) (uuid.UUID, error) {
	const ins = `
		INSERT INTO resumes (candidate_id) VALUES ($1)
		ON CONFLICT (candidate_id) DO UPDATE SET updated_at = resumes.updated_at
		RETURNING id`
	var id uuid.UUID
	if err := r.pool.QueryRow(ctx, ins, candidateID).Scan(&id); err != nil {
		return uuid.Nil, apperror.Internal(err)
	}
	return id, nil
}

func (r *ResumeRepository) GetResumeIDByCandidate(ctx context.Context, candidateID uuid.UUID) (uuid.UUID, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM resumes WHERE candidate_id = $1`, candidateID).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, apperror.NotFound("resume not found")
		}
		return uuid.Nil, apperror.Internal(err)
	}
	return id, nil
}

func (r *ResumeRepository) AddExperience(ctx context.Context, resumeID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error) {
	const q = `
		INSERT INTO work_experiences (resume_id, company_name, position, start_date, end_date, description, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, resume_id, company_name, position, start_date, end_date, description, sort_order`
	var out domain.WorkExperience
	var desc pgtype.Text
	err := r.pool.QueryRow(ctx, q, resumeID, e.CompanyName, e.Position, e.StartDate, e.EndDate, e.Description, e.SortOrder).Scan(
		&out.ID, &out.ResumeID, &out.CompanyName, &out.Position, &out.StartDate, &out.EndDate, &desc, &out.SortOrder,
	)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	out.Description = textFromNullable(desc)
	return &out, nil
}

func (r *ResumeRepository) UpdateExperience(ctx context.Context, id, resumeID uuid.UUID, e domain.WorkExperience) (*domain.WorkExperience, error) {
	const q = `
		UPDATE work_experiences SET company_name=$3, position=$4, start_date=$5, end_date=$6, description=$7, sort_order=$8
		WHERE id=$1 AND resume_id=$2
		RETURNING id, resume_id, company_name, position, start_date, end_date, description, sort_order`
	var out domain.WorkExperience
	var desc pgtype.Text
	err := r.pool.QueryRow(ctx, q, id, resumeID, e.CompanyName, e.Position, e.StartDate, e.EndDate, e.Description, e.SortOrder).Scan(
		&out.ID, &out.ResumeID, &out.CompanyName, &out.Position, &out.StartDate, &out.EndDate, &desc, &out.SortOrder,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("work experience not found")
		}
		return nil, apperror.Internal(err)
	}
	out.Description = textFromNullable(desc)
	return &out, nil
}

func (r *ResumeRepository) DeleteExperience(ctx context.Context, id, resumeID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM work_experiences WHERE id=$1 AND resume_id=$2`, id, resumeID)
	if err != nil {
		return apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return apperror.NotFound("work experience not found")
	}
	return nil
}

func (r *ResumeRepository) AddEducation(ctx context.Context, resumeID uuid.UUID, e domain.Education) (*domain.Education, error) {
	const q = `
		INSERT INTO educations (resume_id, institution, degree, graduation_year, sort_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, resume_id, institution, degree, graduation_year, sort_order`
	var out domain.Education
	err := r.pool.QueryRow(ctx, q, resumeID, e.Institution, e.Degree, e.GraduationYear, e.SortOrder).Scan(
		&out.ID, &out.ResumeID, &out.Institution, &out.Degree, &out.GraduationYear, &out.SortOrder,
	)
	if err != nil {
		return nil, apperror.Internal(err)
	}
	return &out, nil
}

func (r *ResumeRepository) UpdateEducation(ctx context.Context, id, resumeID uuid.UUID, e domain.Education) (*domain.Education, error) {
	const q = `
		UPDATE educations SET institution=$3, degree=$4, graduation_year=$5, sort_order=$6
		WHERE id=$1 AND resume_id=$2
		RETURNING id, resume_id, institution, degree, graduation_year, sort_order`
	var out domain.Education
	err := r.pool.QueryRow(ctx, q, id, resumeID, e.Institution, e.Degree, e.GraduationYear, e.SortOrder).Scan(
		&out.ID, &out.ResumeID, &out.Institution, &out.Degree, &out.GraduationYear, &out.SortOrder,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperror.NotFound("education not found")
		}
		return nil, apperror.Internal(err)
	}
	return &out, nil
}

func (r *ResumeRepository) DeleteEducation(ctx context.Context, id, resumeID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM educations WHERE id=$1 AND resume_id=$2`, id, resumeID)
	if err != nil {
		return apperror.Internal(err)
	}
	if tag.RowsAffected() == 0 {
		return apperror.NotFound("education not found")
	}
	return nil
}
