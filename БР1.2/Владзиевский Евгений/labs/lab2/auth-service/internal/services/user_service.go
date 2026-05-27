package services

import (
	"auth-service/internal/models"
	"auth-service/internal/repositories"
	"auth-service/internal/utils"
	"errors"
)

type UserService struct {
	userRepo   *repositories.UserRepository
	outboxRepo *repositories.OutboxRepository
}

func NewUserService(userRepo *repositories.UserRepository, outboxRepo *repositories.OutboxRepository) *UserService {
	return &UserService{userRepo: userRepo, outboxRepo: outboxRepo}
}

type UpdateUserInput struct {
	FullName *string
	Phone    *string
	Password *string
}

func (s *UserService) GetUser(id uint) (*models.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *UserService) UpdateUser(id uint, input UpdateUserInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if input.FullName != nil {
		user.FullName = *input.FullName
	}
	if input.Phone != nil {
		user.Phone = input.Phone
	}
	if input.Password != nil {
		hashedPassword, err := utils.HashPassword(*input.Password)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = hashedPassword
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	publishUserEvent(s.outboxRepo, user.ID, "user.updated", map[string]interface{}{
		"id":        user.ID,
		"email":     user.Email,
		"full_name": user.FullName,
		"phone":     user.Phone,
		"role":      user.Role,
	})

	return user, nil
}

func (s *UserService) ChangeRole(id uint, role string) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	user.Role = role
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}
