const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'travel.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// 初始化数据库表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
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
    passport_number TEXT,
    country TEXT,
    user_type TEXT DEFAULT 'domestic',
    bio TEXT,
    location TEXT,
    verification_status TEXT,
    verification_submitted_at TEXT,
    rejection_reason TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_lives INTEGER DEFAULT 0,
    total_earnings REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  )`);

  // 会话表
  db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_revoked INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash)`);

  // 检查是否有测试数据
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    if (row.count === 0) {
      // 插入测试数据
      const stmt = db.prepare(`INSERT INTO users 
        (id, email, password_hash, username, avatar, role, is_verified, followers_count, following_count, total_lives, total_earnings) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run('u1', 'alex@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 
        'Alex', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', 'streamer', 1, 1200, 45, 15, 1250.50);
      stmt.run('u2', 'maria@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 
        'Maria', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', 'streamer', 1, 890, 32, 8, 890.00);
      
      stmt.finalize();
      console.log('Inserted test users.');
    }
  });
});

// 数据库操作方法
const dbUtils = {
  // 获取用户通过邮箱
  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // 获取用户通过ID
  getUserById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // 创建用户
  createUser(user) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(user).join(', ');
      const placeholders = Object.keys(user).map(() => '?').join(', ');
      const values = Object.values(user);
      
      db.run(`INSERT INTO users (${fields}) VALUES (${placeholders})`, values, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  // 更新用户
  updateUser(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updates), id];
      
      db.run(`UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // 检查邮箱是否存在
  async emailExists(email) {
    const user = await this.getUserByEmail(email);
    return !!user;
  },

  // 关闭数据库连接
  close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = { db, dbUtils };
