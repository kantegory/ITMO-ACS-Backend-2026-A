CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--(pass is demo1234)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('ivan@qd.com', '$2b$10$DW9V0MrMw/Smdny4gSp1LOBzcHGJBrBqgPNpCDreHognPh.YvyvUC', 'Иван Петров', '+7-900-111-22-33', 'guest'),
('maria@qd.com', '$2b$10$DW9V0MrMw/Smdny4gSp1LOBzcHGJBrBqgPNpCDreHognPh.YvyvUC', 'Мария Смирнова', '+7-900-222-33-44', 'guest'),
('alex@qd.com', '$2b$10$DW9V0MrMw/Smdny4gSp1LOBzcHGJBrBqgPNpCDreHognPh.YvyvUC', 'Алексей Козлов', '+7-900-333-44-55', 'guest'),
('admin@qd.com', '$2b$10$DW9V0MrMw/Smdny4gSp1LOBzcHGJBrBqgPNpCDreHognPh.YvyvUC', 'admin ay', '+7-900-332-44-55', 'admin');
