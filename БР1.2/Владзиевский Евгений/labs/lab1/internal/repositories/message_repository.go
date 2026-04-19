package repositories

import (
	"rental-api/internal/database"
	"rental-api/internal/models"

	"gorm.io/gorm"
)

type MessageRepository interface {
	Create(message *models.Message) error
	FindConversations(userID uint) ([]Conversation, error)
	FindHistory(propertyID, userID, otherUserID uint) ([]models.Message, error)
}

type messageRepository struct {
	db *gorm.DB
}

type Conversation struct {
	PropertyID    uint   `json:"property_id"`
	PropertyTitle string `json:"property_title"`
	OtherUserID   uint   `json:"other_user_id"`
	OtherUserName string `json:"other_user_name"`
	LastMessage   string `json:"last_message"`
	LastSentAt    string `json:"last_sent_at"`
}

func NewMessageRepository() MessageRepository {
	return &messageRepository{db: database.GetDB()}
}

func (r *messageRepository) Create(message *models.Message) error {
	return r.db.Create(message).Error
}

func (r *messageRepository) FindConversations(userID uint) ([]Conversation, error) {
	// Subquery to get the latest message per property + other user
	// We'll use a raw query for simplicity, but could be done with GORM joins
	var conversations []Conversation
	err := r.db.Raw(`
		SELECT 
			m.property_id,
			p.title AS property_title,
			CASE 
				WHEN m.sender_id = ? THEN m.receiver_id
				ELSE m.sender_id
			END AS other_user_id,
			CASE 
				WHEN m.sender_id = ? THEN u2.full_name
				ELSE u1.full_name
			END AS other_user_name,
			m.message_text AS last_message,
			m.sent_at AS last_sent_at
		FROM messages m
		JOIN properties p ON m.property_id = p.id
		JOIN users u1 ON m.sender_id = u1.id
		JOIN users u2 ON m.receiver_id = u2.id
		WHERE m.id IN (
			SELECT MAX(id) 
			FROM messages 
			WHERE sender_id = ? OR receiver_id = ?
			GROUP BY property_id, 
				CASE 
					WHEN sender_id = ? THEN receiver_id
					ELSE sender_id
				END
		)
		ORDER BY m.sent_at DESC
	`, userID, userID, userID, userID, userID).Scan(&conversations).Error
	return conversations, err
}

func (r *messageRepository) FindHistory(propertyID, userID, otherUserID uint) ([]models.Message, error) {
	var messages []models.Message
	err := r.db.
		Where("property_id = ?", propertyID).
		Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userID, otherUserID, otherUserID, userID).
		Order("sent_at ASC").
		Find(&messages).Error
	return messages, err
}
