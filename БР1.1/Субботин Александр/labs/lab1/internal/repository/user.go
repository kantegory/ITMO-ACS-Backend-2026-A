package repository

import (
	"database/sql"

	"github.com/ZZISST/rental-api/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(req model.RegisterRequest, passwordHash string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRow(
		`INSERT INTO users (email, password_hash, full_name, phone)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, email, phone, full_name, is_active, created_at, updated_at`,
		req.Email, passwordHash, req.FullName, req.Phone,
	).Scan(&user.ID, &user.Email, &user.Phone, &user.FullName, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRow(
		`SELECT id, email, phone, password_hash, full_name, is_active, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.Phone, &user.PasswordHash, &user.FullName, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) FindByID(id string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRow(
		`SELECT id, email, phone, password_hash, full_name, is_active, created_at, updated_at
		 FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.Phone, &user.PasswordHash, &user.FullName, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}
