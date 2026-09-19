CREATE TABLE user_roles (
    name VARCHAR(32) PRIMARY KEY
);
INSERT INTO user_roles(name) VALUES ('tenant'), ('landlord'), ('admin');

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL REFERENCES user_roles(name),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);
