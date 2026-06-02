package repositories

import (
	"auth-service/internal/database"
	"auth-service/internal/models"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) Create(user *models.User) error {
	return database.DB.Create(user).Error
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) Update(user *models.User) error {
	return database.DB.Save(user).Error
}

func (r *UserRepository) FindByIDs(ids []uint) ([]models.User, []uint) {
	var users []models.User
	database.DB.Where("id IN ?", ids).Find(&users)

	found := make(map[uint]bool)
	for _, u := range users {
		found[u.ID] = true
	}
	var notFound []uint
	for _, id := range ids {
		if !found[id] {
			notFound = append(notFound, id)
		}
	}
	return users, notFound
}