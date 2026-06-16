package services

import (
	"errors"
	"rental-api/internal/models"
	"rental-api/internal/repositories"
)

type MessageService interface {
	Send(input MessageInput, senderID uint) (*models.Message, error)
	Conversations(userID uint) ([]repositories.Conversation, error)
	History(propertyID, userID, otherUserID uint) ([]models.Message, error)
}

type messageService struct {
	messageRepo  repositories.MessageRepository
	rentalRepo   repositories.RentalRepository
	userRepo     repositories.UserRepository
	propertyRepo repositories.PropertyRepository
}

type MessageInput struct {
	ReceiverID  uint   `json:"receiver_id"`
	PropertyID  uint   `json:"property_id"`
	MessageText string `json:"message_text"`
}

func NewMessageService(
	messageRepo repositories.MessageRepository,
	rentalRepo repositories.RentalRepository,
	userRepo repositories.UserRepository,
	propertyRepo repositories.PropertyRepository,
) MessageService {
	return &messageService{
		messageRepo:  messageRepo,
		rentalRepo:   rentalRepo,
		userRepo:     userRepo,
		propertyRepo: propertyRepo,
	}
}

func (s *messageService) Send(input MessageInput, senderID uint) (*models.Message, error) {
	// Validate message length
	if input.MessageText == "" || len(input.MessageText) > 2000 {
		return nil, errors.New("message must be between 1 and 2000 characters")
	}
	// Ensure receiver exists
	receiver, err := s.userRepo.FindByID(input.ReceiverID)
	if err != nil || receiver == nil {
		return nil, errors.New("receiver not found")
	}
	// Ensure property exists and is active
	property, err := s.propertyRepo.FindByID(input.PropertyID)
	if err != nil || property == nil {
		return nil, errors.New("property not found")
	}
	// Authorization: sender must be tenant or owner of a rental for this property with the receiver as counterpart
	// Find rental where property_id matches and (tenant = sender and owner = receiver) OR (tenant = receiver and owner = sender)
	rentals, _, err := s.rentalRepo.FindAllWithFilters(repositories.RentalFilters{
		PropertyID: &input.PropertyID,
	})
	if err != nil {
		return nil, err
	}
	valid := false
	for _, r := range rentals {
		if (r.TenantID == senderID && r.Property.OwnerID == input.ReceiverID) ||
			(r.TenantID == input.ReceiverID && r.Property.OwnerID == senderID) {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("sender is not participating in rental of this property")
	}
	// Create message
	message := &models.Message{
		SenderID:    senderID,
		ReceiverID:  input.ReceiverID,
		PropertyID:  input.PropertyID,
		MessageText: input.MessageText,
	}
	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}
	// Load sender and receiver for response
	if user, err := s.userRepo.FindByID(senderID); err == nil && user != nil {
		message.Sender = *user
	}
	if user, err := s.userRepo.FindByID(input.ReceiverID); err == nil && user != nil {
		message.Receiver = *user
	}
	if property, err := s.propertyRepo.FindByID(input.PropertyID); err == nil && property != nil {
		message.Property = *property
	}
	return message, nil
}

func (s *messageService) Conversations(userID uint) ([]repositories.Conversation, error) {
	return s.messageRepo.FindConversations(userID)
}

func (s *messageService) History(propertyID, userID, otherUserID uint) ([]models.Message, error) {
	// Authorization: user must be participant in a rental for this property with otherUser
	rentals, _, err := s.rentalRepo.FindAllWithFilters(repositories.RentalFilters{
		PropertyID: &propertyID,
	})
	if err != nil {
		return nil, err
	}
	valid := false
	for _, r := range rentals {
		if (r.TenantID == userID && r.Property.OwnerID == otherUserID) ||
			(r.TenantID == otherUserID && r.Property.OwnerID == userID) {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("user is not participating in rental of this property with the other user")
	}
	return s.messageRepo.FindHistory(propertyID, userID, otherUserID)
}
