package services

import (
	"rental-api/internal/models"
	"rental-api/internal/repositories"
)

type UserService interface {
	GetUser(id uint) (*models.User, error)
	UpdateUser(id uint, updates UpdateUserInput) (*models.User, error)
	ChangeRole(id uint, role string) (*models.User, error)
}

type userService struct {
	userRepo repositories.UserRepository
}

type UpdateUserInput struct {
	FullName *string
	Phone    *string
	Password *string
}

func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetUser(id uint) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *userService) UpdateUser(id uint, updates UpdateUserInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if updates.FullName != nil {
		user.FullName = *updates.FullName
	}
	if updates.Phone != nil {
		user.Phone = updates.Phone
	}
	if updates.Password != nil {
		// Hash new password
		// For simplicity, we'll skip hashing now
		user.PasswordHash = *updates.Password
	}
	err = s.userRepo.Update(user)
	return user, err
}

func (s *userService) ChangeRole(id uint, role string) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	user.Role = role
	err = s.userRepo.Update(user)
	return user, err
}
