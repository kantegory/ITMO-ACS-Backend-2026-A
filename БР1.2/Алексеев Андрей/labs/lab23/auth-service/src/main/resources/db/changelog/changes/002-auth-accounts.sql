--liquibase formatted sql
--changeset auth:002-auth-accounts
CREATE TABLE auth_accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE
);
--rollback DROP TABLE auth_accounts;
