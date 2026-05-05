-- Отдельные БД по сервисам (database-per-service), один экземпляр PostgreSQL.
CREATE DATABASE lab2_auth;
CREATE DATABASE lab2_catalog;
CREATE DATABASE lab2_jobseeker;
CREATE DATABASE lab2_employer;
CREATE DATABASE lab2_application;

GRANT ALL PRIVILEGES ON DATABASE lab2_auth TO lab1_user;
GRANT ALL PRIVILEGES ON DATABASE lab2_catalog TO lab1_user;
GRANT ALL PRIVILEGES ON DATABASE lab2_jobseeker TO lab1_user;
GRANT ALL PRIVILEGES ON DATABASE lab2_employer TO lab1_user;
GRANT ALL PRIVILEGES ON DATABASE lab2_application TO lab1_user;
