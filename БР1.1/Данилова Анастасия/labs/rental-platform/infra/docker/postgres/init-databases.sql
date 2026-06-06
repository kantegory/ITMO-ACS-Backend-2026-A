-- Runs once on first postgres container start (docker-entrypoint-initdb.d).
-- Creates isolated DB + role per microservice (database-per-service in one container).

CREATE USER auth WITH PASSWORD 'auth_password';
CREATE DATABASE auth_db OWNER auth;

CREATE USER property WITH PASSWORD 'property_password';
CREATE DATABASE property_db OWNER property;

CREATE USER rental WITH PASSWORD 'rental_password';
CREATE DATABASE rental_db OWNER rental;

CREATE USER chat WITH PASSWORD 'chat_password';
CREATE DATABASE chat_db OWNER chat;

-- Restrict CONNECT to owners only (admin/superuser still has full access).
REVOKE CONNECT ON DATABASE auth_db FROM PUBLIC;
GRANT CONNECT ON DATABASE auth_db TO auth;

REVOKE CONNECT ON DATABASE property_db FROM PUBLIC;
GRANT CONNECT ON DATABASE property_db TO property;

REVOKE CONNECT ON DATABASE rental_db FROM PUBLIC;
GRANT CONNECT ON DATABASE rental_db TO rental;

REVOKE CONNECT ON DATABASE chat_db FROM PUBLIC;
GRANT CONNECT ON DATABASE chat_db TO chat;

-- GORM AutoMigrate needs schema privileges in each database.
\c auth_db
GRANT ALL ON SCHEMA public TO auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO auth;

\c property_db
GRANT ALL ON SCHEMA public TO property;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO property;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO property;

\c rental_db
GRANT ALL ON SCHEMA public TO rental;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rental;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rental;

\c chat_db
GRANT ALL ON SCHEMA public TO chat;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chat;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO chat;
