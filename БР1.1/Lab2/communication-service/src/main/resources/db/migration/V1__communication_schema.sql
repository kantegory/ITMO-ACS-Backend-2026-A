CREATE TABLE messages (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    property_id UUID NOT NULL,
    message_text VARCHAR(4000) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_messages_participants ON messages(sender_id, receiver_id, property_id, sent_at);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, sent_at);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    type VARCHAR(80) NOT NULL,
    message VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_notification_booking_recipient UNIQUE (booking_id, recipient_id)
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at);
