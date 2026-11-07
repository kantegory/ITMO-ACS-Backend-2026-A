-- ============================================================================
-- ДЗ1. Проектирование базы данных
-- Вариант 5: сервис для обмена рецептами и кулинарных блогов
-- СУБД: PostgreSQL 14+
-- Автор: Кошкарев Кирилл Павлович, БР1.1
-- ============================================================================

DROP TABLE IF EXISTS follows, favorites, likes, comments, recipe_tags,
    recipe_media, recipe_steps, recipe_ingredients, recipes,
    ingredients, tags, cuisines, categories, users CASCADE;

DROP TYPE IF EXISTS user_role, recipe_status, recipe_difficulty, media_type CASCADE;

-- ---------------------------------------------------------------------------
-- Перечисления
-- ---------------------------------------------------------------------------
CREATE TYPE user_role         AS ENUM ('user', 'admin');
CREATE TYPE recipe_status     AS ENUM ('draft', 'published', 'archived');
CREATE TYPE recipe_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE media_type        AS ENUM ('photo', 'video');

-- ---------------------------------------------------------------------------
-- 1. users — пользователи (кулинары, авторы публикаций и читатели)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(128),
    bio           TEXT,
    avatar_url    VARCHAR(512),
    role          user_role    NOT NULL DEFAULT 'user',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. categories — тип блюда (завтрак, суп, десерт, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(64)  NOT NULL UNIQUE,
    slug        VARCHAR(64)  NOT NULL UNIQUE,
    description TEXT
);

-- ---------------------------------------------------------------------------
-- 3. cuisines — кухня мира (итальянская, японская, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE cuisines (
    id   BIGSERIAL   PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(64) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- 4. tags — свободные метки рецептов (#веган, #дёшево, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE tags (
    id   BIGSERIAL   PRIMARY KEY,
    name VARCHAR(48) NOT NULL UNIQUE,
    slug VARCHAR(48) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- 5. ingredients — справочник ингредиентов (нужен для фильтрации по составу)
-- ---------------------------------------------------------------------------
CREATE TABLE ingredients (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(128) NOT NULL UNIQUE,
    default_unit VARCHAR(32)  NOT NULL DEFAULT 'г',
    kcal_per_100 NUMERIC(7,2)
);

-- ---------------------------------------------------------------------------
-- 6. recipes — рецепт (основная публикация кулинарного блога)
-- ---------------------------------------------------------------------------
CREATE TABLE recipes (
    id                BIGSERIAL         PRIMARY KEY,
    author_id         BIGINT            NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    category_id       BIGINT            REFERENCES categories(id)          ON DELETE SET NULL,
    cuisine_id        BIGINT            REFERENCES cuisines(id)            ON DELETE SET NULL,
    title             VARCHAR(160)      NOT NULL,
    slug              VARCHAR(180)      NOT NULL UNIQUE,
    summary           VARCHAR(512),
    description       TEXT,
    difficulty        recipe_difficulty NOT NULL DEFAULT 'easy',
    prep_time_minutes INTEGER           NOT NULL DEFAULT 0 CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER           NOT NULL DEFAULT 0 CHECK (cook_time_minutes >= 0),
    servings          INTEGER           NOT NULL DEFAULT 1 CHECK (servings > 0),
    calories          INTEGER           CHECK (calories IS NULL OR calories >= 0),
    cover_image_url   VARCHAR(512),
    video_url         VARCHAR(512),
    status            recipe_status     NOT NULL DEFAULT 'draft',
    likes_count       INTEGER           NOT NULL DEFAULT 0,
    comments_count    INTEGER           NOT NULL DEFAULT 0,
    published_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipes_author     ON recipes(author_id);
CREATE INDEX idx_recipes_category   ON recipes(category_id);
CREATE INDEX idx_recipes_cuisine    ON recipes(cuisine_id);
CREATE INDEX idx_recipes_status     ON recipes(status);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_cook_time  ON recipes(cook_time_minutes);

-- ---------------------------------------------------------------------------
-- 7. recipe_ingredients — состав рецепта (M:N recipes <-> ingredients)
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_ingredients (
    id            BIGSERIAL    PRIMARY KEY,
    recipe_id     BIGINT       NOT NULL REFERENCES recipes(id)     ON DELETE CASCADE,
    ingredient_id BIGINT       NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity      NUMERIC(9,2) NOT NULL CHECK (quantity > 0),
    unit          VARCHAR(32)  NOT NULL DEFAULT 'г',
    note          VARCHAR(160),
    position      INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT uq_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
);

CREATE INDEX idx_ri_recipe     ON recipe_ingredients(recipe_id);
CREATE INDEX idx_ri_ingredient ON recipe_ingredients(ingredient_id);

-- ---------------------------------------------------------------------------
-- 8. recipe_steps — пошаговые инструкции приготовления
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_steps (
    id               BIGSERIAL    PRIMARY KEY,
    recipe_id        BIGINT       NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number      INTEGER      NOT NULL CHECK (step_number > 0),
    instruction      TEXT         NOT NULL,
    image_url        VARCHAR(512),
    duration_minutes INTEGER      CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    CONSTRAINT uq_recipe_step UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_steps_recipe ON recipe_steps(recipe_id);

-- ---------------------------------------------------------------------------
-- 9. recipe_media — галерея фото/видео рецепта
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_media (
    id         BIGSERIAL    PRIMARY KEY,
    recipe_id  BIGINT       NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    url        VARCHAR(512) NOT NULL,
    type       media_type   NOT NULL DEFAULT 'photo',
    caption    VARCHAR(160),
    position   INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_recipe ON recipe_media(recipe_id);

-- ---------------------------------------------------------------------------
-- 10. recipe_tags — связь рецептов и тегов (M:N)
-- ---------------------------------------------------------------------------
CREATE TABLE recipe_tags (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id    BIGINT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag_id);

-- ---------------------------------------------------------------------------
-- 11. comments — комментарии к рецептам (с поддержкой ответов)
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
    id         BIGSERIAL   PRIMARY KEY,
    recipe_id  BIGINT      NOT NULL REFERENCES recipes(id)  ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    parent_id  BIGINT      REFERENCES comments(id)          ON DELETE CASCADE,
    body       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_recipe ON comments(recipe_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ---------------------------------------------------------------------------
-- 12. likes — лайки рецептов (M:N users <-> recipes)
-- ---------------------------------------------------------------------------
CREATE TABLE likes (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_like UNIQUE (user_id, recipe_id)
);

-- ---------------------------------------------------------------------------
-- 13. favorites — сохранённые рецепты в личном кабинете
-- ---------------------------------------------------------------------------
CREATE TABLE favorites (
    id         BIGSERIAL   PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_favorite UNIQUE (user_id, recipe_id)
);

-- ---------------------------------------------------------------------------
-- 14. follows — подписки на кулинаров (рефлексивная M:N связь users <-> users)
-- ---------------------------------------------------------------------------
CREATE TABLE follows (
    id           BIGSERIAL   PRIMARY KEY,
    follower_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_follow      UNIQUE (follower_id, following_id),
    CONSTRAINT ck_no_selffollow CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following ON follows(following_id);
