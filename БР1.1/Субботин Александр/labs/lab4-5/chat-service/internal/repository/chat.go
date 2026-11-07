package repository

import (
	"database/sql"

	"github.com/ZZISST/rental-chat-service/internal/model"
)

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) ListByUser(userID string, limit, offset int) ([]model.Chat, int, error) {
	var total int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM chats c
		 JOIN chat_participants cp ON c.id = cp.chat_id
		 WHERE cp.user_id = $1`, userID,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		`SELECT c.id, c.property_id, c.booking_id, c.created_at
		 FROM chats c
		 JOIN chat_participants cp ON c.id = cp.chat_id
		 WHERE cp.user_id = $1
		 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var chats []model.Chat
	for rows.Next() {
		var ch model.Chat
		if err := rows.Scan(&ch.ID, &ch.PropertyID, &ch.BookingID, &ch.CreatedAt); err != nil {
			return nil, 0, err
		}
		chats = append(chats, ch)
	}
	return chats, total, nil
}

func (r *ChatRepository) IsParticipant(chatID, userID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		"SELECT COUNT(*) FROM chat_participants WHERE chat_id = $1 AND user_id = $2",
		chatID, userID,
	).Scan(&count)
	return count > 0, err
}

func (r *ChatRepository) GetMessages(chatID string, limit, offset int) ([]model.Message, int, error) {
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM messages WHERE chat_id = $1", chatID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		`SELECT id, chat_id, sender_id, text, created_at, is_read
		 FROM messages WHERE chat_id = $1
		 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
		chatID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var messages []model.Message
	for rows.Next() {
		var m model.Message
		if err := rows.Scan(&m.ID, &m.ChatID, &m.SenderID, &m.Text, &m.CreatedAt, &m.IsRead); err != nil {
			return nil, 0, err
		}
		messages = append(messages, m)
	}
	return messages, total, nil
}

func (r *ChatRepository) CreateChat(creatorID string, req model.CreateChatRequest) (*model.Chat, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	chat := &model.Chat{}
	err = tx.QueryRow(
		`INSERT INTO chats (property_id, booking_id)
		 VALUES ($1, $2)
		 RETURNING id, property_id, booking_id, created_at`,
		req.PropertyID, req.BookingID,
	).Scan(&chat.ID, &chat.PropertyID, &chat.BookingID, &chat.CreatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(
		"INSERT INTO chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)",
		chat.ID, creatorID, req.ParticipantID,
	)
	if err != nil {
		return nil, err
	}

	return chat, tx.Commit()
}

func (r *ChatRepository) SendMessage(chatID, senderID, text string) (*model.Message, error) {
	m := &model.Message{}
	err := r.db.QueryRow(
		`INSERT INTO messages (chat_id, sender_id, text)
		 VALUES ($1, $2, $3)
		 RETURNING id, chat_id, sender_id, text, created_at, is_read`,
		chatID, senderID, text,
	).Scan(&m.ID, &m.ChatID, &m.SenderID, &m.Text, &m.CreatedAt, &m.IsRead)
	if err != nil {
		return nil, err
	}
	return m, nil
}
