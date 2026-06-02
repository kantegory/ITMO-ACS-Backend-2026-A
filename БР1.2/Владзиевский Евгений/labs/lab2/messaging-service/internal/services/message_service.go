package services

import (
	"errors"
	"messaging-service/internal/client"
	"messaging-service/internal/models"
	"messaging-service/internal/repositories"
)

type MessageService interface {
	Send(input MessageInput, senderID int) (*models.Message, error)
	Conversations(userID int) ([]ConversationResult, error)
	History(propertyID, userID, otherUserID int) ([]MessageResult, error)
}

type messageService struct {
	messageRepo    repositories.MessageRepository
	authClient     *client.AuthClient
	bookingClient  *client.BookingClient
	propertyClient *client.PropertyClient
}

type MessageInput struct {
	ReceiverID  int    `json:"receiver_id"`
	PropertyID  int    `json:"property_id"`
	MessageText string `json:"message_text"`
}

type ConversationResult struct {
	PropertyID      int    `json:"property_id"`
	PropertyTitle   string `json:"property_title"`
	OtherUserID     int    `json:"other_user_id"`
	OtherUserName   string `json:"other_user_name"`
	LastMessage     string `json:"last_message"`
	LastSentAt      string `json:"last_sent_at"`
}

type MessageResult struct {
	ID          uint   `json:"id"`
	SenderID    int    `json:"sender_id"`
	SenderName  string `json:"sender_name"`
	ReceiverID  int    `json:"receiver_id"`
	ReceiverName string `json:"receiver_name"`
	PropertyID  int    `json:"property_id"`
	MessageText string `json:"message_text"`
	SentAt      string `json:"sent_at"`
}

func NewMessageService(
	messageRepo repositories.MessageRepository,
	authClient *client.AuthClient,
	bookingClient *client.BookingClient,
	propertyClient *client.PropertyClient,
) MessageService {
	return &messageService{
		messageRepo:    messageRepo,
		authClient:     authClient,
		bookingClient:  bookingClient,
		propertyClient: propertyClient,
	}
}

func (s *messageService) Send(input MessageInput, senderID int) (*models.Message, error) {
	if input.MessageText == "" || len(input.MessageText) > 2000 {
		return nil, errors.New("message must be between 1 and 2000 characters")
	}

	hasRental, err := s.bookingClient.CheckRental(input.PropertyID, senderID, input.ReceiverID)
	if err != nil {
		return nil, errors.New("failed to verify rental participation: " + err.Error())
	}
	if !hasRental {
		return nil, errors.New("sender is not participating in rental of this property")
	}

	message := &models.Message{
		SenderID:    senderID,
		ReceiverID:  input.ReceiverID,
		PropertyID:  input.PropertyID,
		MessageText: input.MessageText,
	}
	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}

	return message, nil
}

func (s *messageService) Conversations(userID int) ([]ConversationResult, error) {
	conversations, err := s.messageRepo.FindConversations(userID)
	if err != nil {
		return nil, err
	}

	results := make([]ConversationResult, len(conversations))
	for i, conv := range conversations {
		var otherUserID int
		if conv.SenderID == userID {
			otherUserID = conv.ReceiverID
		} else {
			otherUserID = conv.SenderID
		}

		otherUserName := ""
		if userInfo, err := s.authClient.GetUserByID(uint(otherUserID)); err == nil {
			otherUserName = userInfo.FullName
		}

		propertyTitle := ""
		if title, err := s.propertyClient.GetPropertyTitle(conv.PropertyID); err == nil {
			propertyTitle = title
		}

		results[i] = ConversationResult{
			PropertyID:    conv.PropertyID,
			PropertyTitle: propertyTitle,
			OtherUserID:   otherUserID,
			OtherUserName: otherUserName,
			LastMessage:   conv.LastMessage,
			LastSentAt:    conv.LastSentAt,
		}
	}
	return results, nil
}

func (s *messageService) History(propertyID, userID, otherUserID int) ([]MessageResult, error) {
	hasRental, err := s.bookingClient.CheckRental(propertyID, userID, otherUserID)
	if err != nil {
		return nil, errors.New("failed to verify rental participation: " + err.Error())
	}
	if !hasRental {
		return nil, errors.New("user is not participating in rental of this property with the other user")
	}

	messages, err := s.messageRepo.FindHistory(propertyID, userID, otherUserID)
	if err != nil {
		return nil, err
	}

	senderNames := make(map[int]string)
	receiverNames := make(map[int]string)

	for _, msg := range messages {
		if _, ok := senderNames[msg.SenderID]; !ok {
			if userInfo, err := s.authClient.GetUserByID(uint(msg.SenderID)); err == nil {
				senderNames[msg.SenderID] = userInfo.FullName
			}
		}
		if _, ok := receiverNames[msg.ReceiverID]; !ok {
			if userInfo, err := s.authClient.GetUserByID(uint(msg.ReceiverID)); err == nil {
				receiverNames[msg.ReceiverID] = userInfo.FullName
			}
		}
	}

	results := make([]MessageResult, len(messages))
	for i, msg := range messages {
		results[i] = MessageResult{
			ID:            msg.ID,
			SenderID:      msg.SenderID,
			SenderName:    senderNames[msg.SenderID],
			ReceiverID:    msg.ReceiverID,
			ReceiverName:  receiverNames[msg.ReceiverID],
			PropertyID:    msg.PropertyID,
			MessageText:   msg.MessageText,
			SentAt:        msg.SentAt.Format("2006-01-02T15:04:05Z"),
		}
	}
	return results, nil
}