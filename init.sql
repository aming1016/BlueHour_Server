-- Travel Live 数据库初始化脚本
-- 适用于 SQLite

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

-- 创建 users 表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar TEXT,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'active',
  auth_provider TEXT DEFAULT 'email',
  auth_provider_id TEXT,
  is_verified INTEGER DEFAULT 0,
  real_name TEXT,
  id_card_number TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  verification_status TEXT,
  verification_submitted_at TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_lives INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- 创建 sessions 表
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_revoked INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- 插入测试数据
INSERT INTO users (id, email, password_hash, username, avatar, role, is_verified, followers_count, following_count, total_lives, total_earnings) VALUES 
('u1', 'alex@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Alex', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'streamer', 1, 1200, 45, 15, 1250.50),
('u2', 'maria@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Maria', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', 'streamer', 1, 890, 32, 8, 890.00),
('u3', 'john@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'John', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', 'viewer', 0, 560, 78, 0, 0),
('u4', 'wang@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '王导游', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', 'guide', 1, 2300, 12, 50, 5000.00),
('u5', 'li@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Backpacker小李', 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', 'viewer', 0, 340, 156, 0, 0);

-- 验证数据
SELECT 'Users created: ' || COUNT(*) FROM users;
