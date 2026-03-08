const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { dbUtils } = require('./db');

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

// ==================== 密码工具 ====================

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'salt').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// ==================== JWT 工具 ====================

function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ==================== 认证中间件 ====================

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonRes(res, { code: 401, message: '未提供认证token' }, 401);
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return jsonRes(res, { code: 401, message: 'token无效或已过期' }, 401);
  }
  
  try {
    const user = await dbUtils.getUserById(decoded.userId);
    if (!user || user.status === 'banned') {
      return jsonRes(res, { code: 401, message: '用户不存在或已被禁用' }, 401);
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// ==================== API 处理器 ====================

// 注册
async function handleRegister(req, res) {
  const { email, password, username } = await parseBody(req);
  
  // 参数验证
  if (!email || !password || !username) {
    return jsonRes(res, { code: 400, message: '邮箱、密码和用户名不能为空' }, 400);
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonRes(res, { code: 400, message: '邮箱格式不正确' }, 400);
  }
  
  if (password.length < 6) {
    return jsonRes(res, { code: 400, message: '密码至少需要6个字符' }, 400);
  }
  
  try {
    // 检查邮箱是否已存在
    const exists = await dbUtils.emailExists(email);
    if (exists) {
      return jsonRes(res, { code: 400, message: '该邮箱已注册' }, 400);
    }
    
    // 创建用户
    const userId = 'u' + Date.now();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      username: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      role: 'viewer',
      status: 'active',
      is_verified: 0,
      followers_count: 0,
      following_count: 0,
      total_lives: 0,
      total_earnings: 0
    };
    
    await dbUtils.createUser(user);
    
    // 生成token
    const token = generateToken(user);
    
    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at
    };
    
    return jsonRes(res, {
      code: 0,
      message: '注册成功',
      data: {
        user: userResponse,
        token: token
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 登录
async function handleLogin(req, res) {
  const { email, password } = await parseBody(req);
  
  if (!email || !password) {
    return jsonRes(res, { code: 400, message: '邮箱和密码不能为空' }, 400);
  }
  
  try {
    // 查找用户
    const user = await dbUtils.getUserByEmail(email);
    if (!user) {
      return jsonRes(res, { code: 401, message: '邮箱或密码错误' }, 401);
    }
    
    // 检查账号状态
    if (user.status === 'banned') {
      return jsonRes(res, { code: 403, message: '账号已被禁用' }, 403);
    }
    
    // 验证密码
    if (!verifyPassword(password, user.password_hash)) {
      return jsonRes(res, { code: 401, message: '邮箱或密码错误' }, 401);
    }
    
    // 更新最后登录时间
    await dbUtils.updateUser(user.id, { last_login_at: new Date().toISOString() });
    
    // 生成token
    const token = generateToken(user);
    
    // 返回用户信息
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      is_verified: !!user.is_verified,
      followers_count: user.followers_count,
      following_count: user.following_count,
      total_lives: user.total_lives,
      total_earnings: user.total_earnings
    };
    
    return jsonRes(res, {
      code: 0,
      message: '登录成功',
      data: {
        user: userResponse,
        token: token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 登出
async function handleLogout(req, res) {
  return jsonRes(res, {
    code: 0,
    message: '登出成功'
  });
}

// 获取当前用户信息
async function handleGetMe(req, res) {
  const user = req.user;
  
  const userResponse = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
    is_verified: !!user.is_verified,
    followers_count: user.followers_count,
    following_count: user.following_count,
    total_lives: user.total_lives,
    total_earnings: user.total_earnings
  };
  
  return jsonRes(res, {
    code: 0,
    data: userResponse
  });
}

// 更新用户信息
async function handleUpdateProfile(req, res) {
  const user = req.user;
  const { username, avatar, bio, location } = await parseBody(req);
  
  const updates = {};
  if (username) updates.username = username;
  if (avatar) updates.avatar = avatar;
  if (bio) updates.bio = bio;
  if (location) updates.location = location;
  
  try {
    await dbUtils.updateUser(user.id, updates);
    
    return jsonRes(res, {
      code: 0,
      message: '更新成功',
      data: {
        id: user.id,
        username: username || user.username,
        avatar: avatar || user.avatar,
        bio: bio || user.bio,
        location: location || user.location
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 修改密码
async function handleChangePassword(req, res) {
  const user = req.user;
  const { old_password, new_password } = await parseBody(req);
  
  if (!old_password || !new_password) {
    return jsonRes(res, { code: 400, message: '旧密码和新密码不能为空' }, 400);
  }
  
  if (new_password.length < 6) {
    return jsonRes(res, { code: 400, message: '新密码至少需要6个字符' }, 400);
  }
  
  if (!verifyPassword(old_password, user.password_hash)) {
    return jsonRes(res, { code: 400, message: '旧密码错误' }, 400);
  }
  
  try {
    await dbUtils.updateUser(user.id, { 
      password_hash: hashPassword(new_password)
    });
    
    return jsonRes(res, {
      code: 0,
      message: '密码修改成功'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 申请主播认证（简化版 - 无限制）
async function handleVerification(req, res) {
  const user = req.user;
  const { real_name, email, location, bio } = await parseBody(req);
  
  // 简化验证：只要求姓名和邮箱
  if (!real_name || !email) {
    return jsonRes(res, { code: 400, message: '姓名和邮箱不能为空' }, 400);
  }
  
  try {
    await dbUtils.updateUser(user.id, {
      real_name: real_name,
      email: email,
      location: location || null,
      bio: bio || null,
      verification_status: 'pending',
      verification_submitted_at: new Date().toISOString()
    });
    
    return jsonRes(res, {
      code: 0,
      message: '申请已提交',
      data: {
        verification_status: 'pending',
        submitted_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 获取认证状态
async function handleGetVerificationStatus(req, res) {
  const user = req.user;
  
  try {
    const userData = await dbUtils.getUserById(user.id);
    if (!userData) {
      return jsonRes(res, { code: 404, message: '用户不存在' }, 404);
    }
    
    const responseData = {
      is_verified: !!userData.is_verified,
      verification_status: userData.verification_status || 'none',
      submitted_at: userData.verification_submitted_at,
      user_type: userData.user_type || 'domestic',
      real_name: userData.real_name,
      guide_license: userData.guide_license,
      experience: userData.experience,
      rejection_reason: userData.rejection_reason
    };
    
    // 根据用户类型返回不同证件信息
    if (userData.user_type === 'international') {
      responseData.passport_number = userData.passport_number;
      responseData.email = userData.email;
      responseData.country = userData.country;
    } else {
      responseData.id_card_number = userData.id_card_number;
      responseData.phone = userData.phone;
    }
    
    return jsonRes(res, {
      code: 0,
      data: responseData
    });
  } catch (err) {
    console.error('Get verification status error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 审核主播认证（管理员接口）
async function handleApproveVerification(req, res) {
  const { userId, action, reason } = await parseBody(req);
  
  if (!userId || !action) {
    return jsonRes(res, { code: 400, message: '用户ID和操作不能为空' }, 400);
  }
  
  if (!['approve', 'reject'].includes(action)) {
    return jsonRes(res, { code: 400, message: '操作必须是 approve 或 reject' }, 400);
  }
  
  try {
    const user = await dbUtils.getUserById(userId);
    if (!user) {
      return jsonRes(res, { code: 404, message: '用户不存在' }, 404);
    }
    
    if (action === 'approve') {
      await dbUtils.updateUser(userId, {
        is_verified: 1,
        verification_status: 'approved',
        role: 'streamer'
      });
      
      return jsonRes(res, {
        code: 0,
        message: '认证已通过',
        data: { userId, status: 'approved' }
      });
    } else {
      await dbUtils.updateUser(userId, {
        is_verified: 0,
        verification_status: 'rejected',
        rejection_reason: reason || null
      });
      
      return jsonRes(res, {
        code: 0,
        message: '认证已拒绝',
        data: { userId, status: 'rejected', reason }
      });
    }
  } catch (err) {
    console.error('Approve verification error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// ==================== 工具函数 ====================

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function jsonRes(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ==================== 导出 ====================

module.exports = {
  authMiddleware,
  handleRegister,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleUpdateProfile,
  handleChangePassword,
  handleVerification,
  handleGetVerificationStatus,
  handleApproveVerification,
  verifyToken
};
