package repository

import (
	"auth/internal/models"
	"github.com/jmoiron/sqlx"
)

type AuthRepository struct {
	db *sqlx.DB
}

func NewAuthRepository(db *sqlx.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateUser(u *models.User) error {
	query := `INSERT INTO users (email, password_hash, full_name, phone, role)
			  VALUES ($1, $2, $3, $4, 'guest') RETURNING id, created_at`
	return r.db.QueryRow(query, u.Email, u.PasswordHash, u.FullName, u.Phone).Scan(&u.ID, &u.CreatedAt)
}

func (r *AuthRepository) GetUserByEmail(email string) (*models.User, error) {
	var u models.User
	err := r.db.Get(&u, "SELECT * FROM users WHERE email = $1", email)
	return &u, err
}
