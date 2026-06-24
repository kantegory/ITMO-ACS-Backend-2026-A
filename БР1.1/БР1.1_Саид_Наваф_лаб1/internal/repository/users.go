package repository

import (
	"context"
	"job-search-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UsersRepo struct {
	db *pgxpool.Pool
}

func NewUsersRepo(db *pgxpool.Pool) *UsersRepo {
	return &UsersRepo{db: db}
}


func (r *UsersRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, email, phone, role, password_hash, registered_at FROM users WHERE email = $1`
	var user model.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Phone, &user.Role, &user.PasswordHash, &user.RegisteredAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}


func (r *UsersRepo) Create(ctx context.Context, email, phone, role, passwordHash string) (*model.User, error) {
	query := `
		INSERT INTO users (email, phone, role, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, phone, role, registered_at
	`
	var user model.User
	err := r.db.QueryRow(ctx, query, email, phone, role, passwordHash).Scan(
		&user.ID, &user.Email, &user.Phone, &user.Role, &user.RegisteredAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}


func (r *UsersRepo) GetEmployerIDByUserID(ctx context.Context, userID int) (int, error) {
	var employerID int
	err := r.db.QueryRow(ctx, "SELECT id FROM employers WHERE user_id = $1", userID).Scan(&employerID)
	return employerID, err
}


func (r *UsersRepo) CreateEmployerIfNeeded(ctx context.Context, userID int) (int, error) {
	var employerID int
	err := r.db.QueryRow(ctx,
		"INSERT INTO employers (user_id, company_name) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET company_name = EXCLUDED.company_name RETURNING id",
		userID, "Default Company",
	).Scan(&employerID)
	return employerID, err
}