package services

import (
	"context"
	"errors"
	"fmt"

	"rental-platform/services/chat-service/internal/clients"
	"rental-platform/services/chat-service/internal/models"
	"rental-platform/services/chat-service/internal/repository"
	"rental-platform/shared/dto/events"
	"rental-platform/shared/rabbitmq"

	"gorm.io/gorm"
)

var (
	ErrNotFound   = errors.New("not found")
	ErrForbidden  = errors.New("forbidden")
	ErrBadRequest = errors.New("bad request")
)

type ChatService struct {
	Chats    *repository.ChatRepository
	Messages *repository.MessageRepository
	Property *clients.PropertyClient
	Auth     *clients.AuthClient
	Publisher *rabbitmq.Publisher
}

type ChatShort struct {
	models.Chat
	LastMessage *string `json:"last_message"`
	UnreadCount int64   `json:"unread_count"`
}

type ChatFull struct {
	models.Chat
	Messages []models.Message `json:"messages"`
}

type PropertyChatStats struct {
	PropertyID uint  `json:"property_id"`
	TotalChats int64 `json:"total_chats"`
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound) || errors.Is(err, ErrNotFound) || errors.Is(err, clients.ErrNotFound)
}

func (s *ChatService) ensureParticipant(chat *models.Chat, userID uint) error {
	if chat.TenantID != userID && chat.LandlordID != userID {
		return ErrForbidden
	}
	return nil
}

func (s *ChatService) CreateChat(ctx context.Context, tenantID, propertyID uint) (*models.Chat, bool, error) {
	if s.Property == nil {
		return nil, false, fmt.Errorf("property service is not configured")
	}
	if err := s.Auth.ValidateUser(ctx, tenantID); err != nil {
		if errors.Is(err, clients.ErrNotFound) {
			return nil, false, ErrNotFound
		}
		return nil, false, err
	}

	property, err := s.Property.GetProperty(ctx, propertyID)
	if err != nil {
		if errors.Is(err, clients.ErrNotFound) {
			return nil, false, ErrNotFound
		}
		return nil, false, err
	}

	landlordID := property.OwnerID
	if tenantID == landlordID {
		return nil, false, ErrBadRequest
	}

	existing, err := s.Chats.FindByPropertyAndTenant(propertyID, tenantID)
	if err == nil {
		return existing, true, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	chat := &models.Chat{
		PropertyID: propertyID,
		TenantID:   tenantID,
		LandlordID: landlordID,
	}
	if err := s.Chats.Create(chat); err != nil {
		return nil, false, err
	}

	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.ChatCreated, events.ChatCreatedPayload{
			ChatID:     chat.ID,
			PropertyID: chat.PropertyID,
			TenantID:   chat.TenantID,
			LandlordID: chat.LandlordID,
		})
	}

	return chat, false, nil
}

func (s *ChatService) EnsureChat(ctx context.Context, propertyID, tenantID, landlordID uint) (*models.Chat, error) {
	existing, err := s.Chats.FindByPropertyAndTenant(propertyID, tenantID)
	if err == nil {
		return existing, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	chat := &models.Chat{
		PropertyID: propertyID,
		TenantID:   tenantID,
		LandlordID: landlordID,
	}
	if err := s.Chats.Create(chat); err != nil {
		return nil, err
	}

	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.ChatCreated, events.ChatCreatedPayload{
			ChatID:     chat.ID,
			PropertyID: chat.PropertyID,
			TenantID:   chat.TenantID,
			LandlordID: chat.LandlordID,
		})
	}
	return chat, nil
}

func (s *ChatService) ListChats(userID uint, propertyID *uint, limit, offset int) ([]ChatShort, error) {
	chats, err := s.Chats.ListForUser(userID, propertyID, limit, offset)
	if err != nil {
		return nil, err
	}

	result := make([]ChatShort, 0, len(chats))
	for _, chat := range chats {
		item := ChatShort{Chat: chat}
		if text, ok := s.Chats.LastMessagePreview(chat.ID); ok {
			item.LastMessage = &text
		}
		unread, err := s.Messages.UnreadCount(chat.ID, userID)
		if err != nil {
			return nil, err
		}
		item.UnreadCount = unread
		result = append(result, item)
	}
	return result, nil
}

func (s *ChatService) GetChat(userID, chatID uint) (*ChatFull, error) {
	chat, err := s.Chats.GetByID(chatID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if chat.IsArchived {
		return nil, ErrNotFound
	}
	if err := s.ensureParticipant(chat, userID); err != nil {
		return nil, err
	}

	messages, err := s.Messages.ListByChat(chatID, 1000, 0)
	if err != nil {
		return nil, err
	}

	return &ChatFull{Chat: *chat, Messages: messages}, nil
}

func (s *ChatService) DeleteChat(userID, chatID uint) error {
	chat, err := s.Chats.GetByID(chatID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if err := s.ensureParticipant(chat, userID); err != nil {
		return err
	}
	if err := s.Messages.DeleteByChat(chatID); err != nil {
		return err
	}
	return s.Chats.Delete(chatID)
}

func (s *ChatService) ListMessages(userID, chatID uint, limit, offset int) ([]models.Message, error) {
	chat, err := s.Chats.GetByID(chatID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if chat.IsArchived {
		return nil, ErrNotFound
	}
	if err := s.ensureParticipant(chat, userID); err != nil {
		return nil, err
	}
	return s.Messages.ListByChat(chatID, limit, offset)
}

func (s *ChatService) SendMessage(ctx context.Context, userID, chatID uint, text string) (*models.Message, error) {
	chat, err := s.Chats.GetByID(chatID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if chat.IsArchived {
		return nil, ErrForbidden
	}
	if err := s.ensureParticipant(chat, userID); err != nil {
		return nil, err
	}

	msg := &models.Message{
		ChatID:   chatID,
		SenderID: userID,
		Text:     text,
		IsRead:   false,
	}
	if err := s.Messages.Create(msg); err != nil {
		return nil, err
	}

	if s.Publisher != nil {
		_ = s.Publisher.Publish(ctx, events.MessageSent, events.MessageSentPayload{
			MessageID: msg.ID,
			ChatID:    msg.ChatID,
			SenderID:  msg.SenderID,
		})
	}
	return msg, nil
}

func (s *ChatService) UpdateMessage(userID, messageID uint, text string) (*models.Message, error) {
	msg, err := s.Messages.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if msg.SenderID != userID {
		return nil, ErrForbidden
	}

	msg.Text = text
	s.Messages.TouchUpdatedAt(msg)
	if err := s.Messages.Update(msg); err != nil {
		return nil, err
	}
	return msg, nil
}

func (s *ChatService) DeleteMessage(userID, messageID uint) error {
	msg, err := s.Messages.GetByID(messageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if msg.SenderID != userID {
		return ErrForbidden
	}
	return s.Messages.Delete(messageID)
}

func (s *ChatService) MarkRead(userID, chatID uint) error {
	chat, err := s.Chats.GetByID(chatID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if chat.IsArchived {
		return ErrNotFound
	}
	if err := s.ensureParticipant(chat, userID); err != nil {
		return err
	}
	return s.Messages.MarkRead(chatID, userID)
}

func (s *ChatService) PropertyStats(propertyID uint) (*PropertyChatStats, error) {
	count, err := s.Chats.CountByProperty(propertyID)
	if err != nil {
		return nil, err
	}
	return &PropertyChatStats{PropertyID: propertyID, TotalChats: count}, nil
}

func (s *ChatService) ArchiveChatsForUser(userID uint) error {
	return s.Chats.ArchiveByUserID(userID)
}
