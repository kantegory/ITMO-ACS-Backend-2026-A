package repository

import (
	"rental-platform/services/auth-service/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	DB *gorm.DB
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) GetByID(id uint) (*models.User, error) {
	var user models.User
	err := r.DB.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

func (r *UserRepository) Save(user *models.User) error {
	return r.DB.Save(user).Error
}

func (r *UserRepository) List(limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	q := r.DB.Model(&models.User{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("id desc").Limit(limit).Offset(offset).Find(&users).Error
	return users, total, err
}

func (r *UserRepository) FindActiveByIDs(ids []uint) ([]uint, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var found []uint
	err := r.DB.Model(&models.User{}).Where("id IN ? AND is_active = ?", ids, true).Pluck("id", &found).Error
	return found, err
}

type RefreshTokenRepository struct {
	DB *gorm.DB
}

func (r *RefreshTokenRepository) Create(token *models.RefreshToken) error {
	return r.DB.Create(token).Error
}

func (r *RefreshTokenRepository) GetByHash(hash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.DB.Where("token_hash = ?", hash).First(&token).Error
	return &token, err
}

func (r *RefreshTokenRepository) RevokeByUserID(userID uint) error {
	now := r.DB.NowFunc()
	return r.DB.Model(&models.RefreshToken{}).Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}

func (r *RefreshTokenRepository) RevokeByHash(hash string) error {
	now := r.DB.NowFunc()
	return r.DB.Model(&models.RefreshToken{}).Where("token_hash = ?", hash).
		Update("revoked_at", now).Error
}
