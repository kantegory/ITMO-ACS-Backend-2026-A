-- Chats are scoped to a listing + two users (not globally per user pair).

DELETE FROM messages;
DELETE FROM chats;

ALTER TABLE chats
    ADD COLUMN listing_id BIGINT NOT NULL REFERENCES listings (id);

ALTER TABLE chats DROP CONSTRAINT uq_chats_users;

ALTER TABLE chats
    ADD CONSTRAINT uq_chats_users_listing UNIQUE (user1_id, user2_id, listing_id);

CREATE INDEX idx_chats_listing_id ON chats (listing_id);
