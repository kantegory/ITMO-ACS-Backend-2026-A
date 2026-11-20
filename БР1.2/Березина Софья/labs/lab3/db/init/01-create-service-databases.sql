CREATE ROLE auth_user LOGIN PASSWORD 'auth_pass';
CREATE ROLE users_user LOGIN PASSWORD 'users_pass';
CREATE ROLE workouts_user LOGIN PASSWORD 'workouts_pass';
CREATE ROLE user_workouts_user LOGIN PASSWORD 'user_workouts_pass';
CREATE ROLE progress_user LOGIN PASSWORD 'progress_pass';
CREATE ROLE blog_user LOGIN PASSWORD 'blog_pass';

CREATE DATABASE auth_db OWNER auth_user;
CREATE DATABASE users_db OWNER users_user;
CREATE DATABASE workouts_db OWNER workouts_user;
CREATE DATABASE user_workouts_db OWNER user_workouts_user;
CREATE DATABASE progress_db OWNER progress_user;
CREATE DATABASE blog_db OWNER blog_user;
