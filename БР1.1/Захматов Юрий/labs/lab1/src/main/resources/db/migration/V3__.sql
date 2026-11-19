-- Удаляем старые колонки из V2 (которые были неправильными)
ALTER TABLE chat DROP COLUMN IF EXISTS user1id_id;
ALTER TABLE chat DROP COLUMN IF EXISTS user2id_id;

-- Добавляем правильные колонки
ALTER TABLE chat ADD COLUMN user1_id BIGINT NOT NULL;
ALTER TABLE chat ADD COLUMN user2_id BIGINT NOT NULL;

-- Добавляем внешние ключи
ALTER TABLE chat ADD CONSTRAINT FK_CHAT_ON_USER1 FOREIGN KEY (user1_id) REFERENCES _user_ (id);
ALTER TABLE chat ADD CONSTRAINT FK_CHAT_ON_USER2 FOREIGN KEY (user2_id) REFERENCES _user_ (id);

-- Удаляем старые foreign keys если были
ALTER TABLE chat DROP CONSTRAINT IF EXISTS FK_CHAT_ON_USER1ID;
ALTER TABLE chat DROP CONSTRAINT IF EXISTS FK_CHAT_ON_USER2ID;