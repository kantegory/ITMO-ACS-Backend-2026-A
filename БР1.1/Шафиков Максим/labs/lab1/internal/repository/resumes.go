package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"job-search/internal/model"
)

type ResumesRepo struct {
	pool *pgxpool.Pool
}

func (r *ResumesRepo) loadSkills(ctx context.Context, resumeID uuid.UUID) ([]model.Skill, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name FROM skills s
		 JOIN resume_skills rs ON rs.skill_id = s.id
		 WHERE rs.resume_id = $1
		 ORDER BY s.name`,
		resumeID,
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

func (r *ResumesRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]model.Resume, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, full_name, title, bio, created_at, updated_at
		 FROM resumes WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resumes []model.Resume
	for rows.Next() {
		var res model.Resume
		if err := rows.Scan(&res.ID, &res.UserID, &res.FullName, &res.Title, &res.Bio, &res.CreatedAt, &res.UpdatedAt); err != nil {
			return nil, err
		}
		resumes = append(resumes, res)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range resumes {
		skills, err := r.loadSkills(ctx, resumes[i].ID)
		if err != nil {
			return nil, err
		}
		resumes[i].Skills = skills
	}

	if resumes == nil {
		resumes = []model.Resume{}
	}
	return resumes, nil
}

func (r *ResumesRepo) Create(ctx context.Context, userID uuid.UUID, fullName, title, bio *string, skillIDs []uuid.UUID) (*model.Resume, error) {
	var res model.Resume
	err := r.pool.QueryRow(ctx,
		`INSERT INTO resumes (user_id, full_name, title, bio)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, full_name, title, bio, created_at, updated_at`,
		userID, fullName, title, bio,
	).Scan(&res.ID, &res.UserID, &res.FullName, &res.Title, &res.Bio, &res.CreatedAt, &res.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if len(skillIDs) > 0 {
		for _, sid := range skillIDs {
			_, err = r.pool.Exec(ctx,
				`INSERT INTO resume_skills (resume_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				res.ID, sid,
			)
			if err != nil {
				return nil, err
			}
		}
	}

	skills, err := r.loadSkills(ctx, res.ID)
	if err != nil {
		return nil, err
	}
	res.Skills = skills
	return &res, nil
}

func (r *ResumesRepo) GetByID(ctx context.Context, id uuid.UUID) (*model.Resume, error) {
	var res model.Resume
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, full_name, title, bio, created_at, updated_at
		 FROM resumes WHERE id = $1`,
		id,
	).Scan(&res.ID, &res.UserID, &res.FullName, &res.Title, &res.Bio, &res.CreatedAt, &res.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	skills, err := r.loadSkills(ctx, res.ID)
	if err != nil {
		return nil, err
	}
	res.Skills = skills
	return &res, nil
}

func (r *ResumesRepo) Update(ctx context.Context, id uuid.UUID, fullName, title, bio *string, skillIDs []uuid.UUID) (*model.Resume, error) {
	var res model.Resume
	err := r.pool.QueryRow(ctx,
		`UPDATE resumes SET
		     full_name = COALESCE($2, full_name),
		     title = COALESCE($3, title),
		     bio = COALESCE($4, bio),
		     updated_at = now()
		 WHERE id = $1
		 RETURNING id, user_id, full_name, title, bio, created_at, updated_at`,
		id, fullName, title, bio,
	).Scan(&res.ID, &res.UserID, &res.FullName, &res.Title, &res.Bio, &res.CreatedAt, &res.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if skillIDs != nil {
		if _, err = r.pool.Exec(ctx,
			`DELETE FROM resume_skills WHERE resume_id = $1`, id,
		); err != nil {
			return nil, err
		}
		for _, sid := range skillIDs {
			if _, err = r.pool.Exec(ctx,
				`INSERT INTO resume_skills (resume_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
				res.ID, sid,
			); err != nil {
				return nil, err
			}
		}
	}

	skills, err := r.loadSkills(ctx, res.ID)
	if err != nil {
		return nil, err
	}
	res.Skills = skills
	return &res, nil
}

func (r *ResumesRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM resumes WHERE id = $1`, id)
	return err
}

func (r *ResumesRepo) HasActiveApplications(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM applications WHERE resume_id = $1`,
		id,
	).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
