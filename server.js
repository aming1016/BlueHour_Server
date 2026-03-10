const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// ==================== 用户认证模块 ====================
const {
  authMiddleware,
  handleRegister,
  handleLogin,
  handleLogout,
  handleGetMe,
  handleUpdateProfile,
  handleChangePassword,
  handleVerification,
  handleGetVerificationStatus,
  handleApproveVerification
} = require('./auth');

// ==================== 直播模块 ====================
const {
  handleCreateStream,
  handleEndStream,
  handleGetStreamInfo,
  handleGetLiveStreams,
} = require('./stream_api');

// ==================== 模拟数据库 ====================
const db = {
  // 用户表
  users: [
    { id: 'u1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', followers: 1200, following: 45 },
    { id: 'u2', name: 'Maria', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', followers: 890, following: 32 },
    { id: 'u3', name: 'John', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', followers: 560, following: 78 },
    { id: 'u4', name: '王导游', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', followers: 2300, following: 12 },
    { id: 'u5', name: 'Backpacker小李', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', followers: 340, following: 156 },
  ],
  
  // 直播表
  streams: [
    { 
      id: 's1', 
      title: 'Beijing Hutong Walk - 胡同里的老北京', 
      streamerId: 'u1',
      streamerName: 'Alex',
      streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      viewers: 234, 
      isLive: true,
      thumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      location: 'Beijing, China',
      startedAt: new Date(Date.now() - 3600000).toISOString(), // 1小时前开始
      description: 'Walking through traditional Beijing hutongs, exploring local culture and food!'
    },
    { 
      id: 's2', 
      title: 'Shanghai Night View - 外滩夜景直播', 
      streamerId: 'u2',
      streamerName: 'Maria',
      streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      viewers: 189, 
      isLive: true,
      thumbnail: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=400',
      location: 'Shanghai, China',
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      description: 'The amazing night view of The Bund!'
    },
    { 
      id: 's3', 
      title: 'Chengdu Panda Base - 看大熊猫', 
      streamerId: 'u3',
      streamerName: 'John',
      streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      viewers: 567, 
      isLive: true,
      thumbnail: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400',
      location: 'Chengdu, China',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      description: 'Pandas are so cute! Come watch them eat bamboo!'
    },
    { 
      id: 's4', 
      title: 'Xi\'an Ancient City Wall - 西安古城墙骑行', 
      streamerId: 'u4',
      streamerName: '王导游',
      streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      viewers: 89, 
      isLive: true,
      thumbnail: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=400',
      location: 'Xi\'an, China',
      startedAt: new Date(Date.now() - 5400000).toISOString(),
      description: 'Riding bikes on the ancient city wall of Xi\'an!'
    },
    { 
      id: 's5', 
      title: 'Guilin Landscape - 桂林山水甲天下', 
      streamerId: 'u5',
      streamerName: 'Backpacker小李',
      streamerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      viewers: 123, 
      isLive: true,
      thumbnail: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=400',
      location: 'Guilin, China',
      startedAt: new Date(Date.now() - 900000).toISOString(),
      description: 'The most beautiful landscape in China!'
    },
  ],
  
  // 评论表
  comments: {
    's1': [
      { id: 'c1', userId: 'u2', userName: 'Maria', text: 'Love the hutong vibe!', time: Date.now() - 300000 },
      { id: 'c2', userId: 'u3', userName: 'John', text: 'What food is that?', time: Date.now() - 180000 },
      { id: 'c3', userId: 'u4', userName: '王导游', text: '正宗老北京味儿', time: Date.now() - 60000 },
    ],
    's2': [
      { id: 'c4', userId: 'u1', userName: 'Alex', text: 'Shanghai is amazing at night!', time: Date.now() - 240000 },
      { id: 'c5', userId: 'u5', userName: 'Backpacker小李', text: 'I was there last week!', time: Date.now() - 120000 },
    ],
    's3': [
      { id: 'c6', userId: 'u1', userName: 'Alex', text: '🐼 Pandas!!!', time: Date.now() - 300000 },
      { id: 'c7', userId: 'u2', userName: 'Maria', text: 'So cute! Sending hearts ❤️', time: Date.now() - 150000 },
    ],
  },
  
  // 礼物表
  gifts: [
    { id: 'g1', name: 'Heart', icon: '❤️', price: 1, animation: 'float' },
    { id: 'g2', name: 'Flower', icon: '🌸', price: 5, animation: 'bloom' },
    { id: 'g3', name: 'Star', icon: '⭐', price: 10, animation: 'sparkle' },
    { id: 'g4', name: 'Rocket', icon: '🚀', price: 50, animation: 'fly' },
    { id: 'g5', name: 'Crown', icon: '👑', price: 100, animation: 'shine' },
  ],
  
  // 关注关系表
  follows: {
    'current_user': ['u1', 'u3'] // 当前用户关注了谁
  },
  
  // 钱包表
  wallets: {
    'current_user': { balance: 888.88, currency: 'USD' }
  }
};

// ==================== 工具函数 ====================

// 解析请求体
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

// 发送JSON响应
function jsonRes(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// CORS中间件
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ==================== API路由 ====================

const routes = {
  // 健康检查
  'GET /api/health': async (req, res) => {
    jsonRes(res, { status: 'ok', time: new Date().toISOString() });
  },
  
  // ========== 直播模块 ==========
  
  // 获取直播列表
  'GET /api/streams': async (req, res) => {
    const streams = db.streams.map(s => ({
      id: s.id,
      title: s.title,
      streamerName: s.streamerName,
      streamerAvatar: s.streamerAvatar,
      viewers: s.viewers,
      isLive: s.isLive,
      thumbnail: s.thumbnail,
      location: s.location
    }));
    jsonRes(res, { 
      code: 0, 
      data: streams,
      total: streams.length 
    });
  },
  
  // 获取直播间详情
  'GET /api/streams/:id': async (req, res, params) => {
    const stream = db.streams.find(s => s.id === params.id);
    if (!stream) {
      return jsonRes(res, { code: 404, message: 'Stream not found' }, 404);
    }
    
    // 获取主播信息
    const streamer = db.users.find(u => u.id === stream.streamerId);
    
    jsonRes(res, {
      code: 0,
      data: {
        ...stream,
        streamerFollowers: streamer?.followers || 0,
        isFollowing: db.follows['current_user'].includes(stream.streamerId)
      }
    });
  },
  
  // ========== 评论模块 ==========
  
  // 获取评论列表
  'GET /api/streams/:id/comments': async (req, res, params) => {
    const comments = db.comments[params.id] || [];
    const enriched = comments.map(c => ({
      ...c,
      userAvatar: db.users.find(u => u.id === c.userId)?.avatar
    }));
    jsonRes(res, { code: 0, data: enriched });
  },
  
  // 发送评论
  'POST /api/streams/:id/comments': async (req, res, params) => {
    const body = await parseBody(req);
    const { text, userId = 'current_user' } = body;
    
    if (!text || text.trim() === '') {
      return jsonRes(res, { code: 400, message: 'Comment text required' }, 400);
    }
    
    const stream = db.streams.find(s => s.id === params.id);
    if (!stream) {
      return jsonRes(res, { code: 404, message: 'Stream not found' }, 404);
    }
    
    const user = db.users.find(u => u.id === userId) || { id: userId, name: 'Guest' };
    
    const newComment = {
      id: `c${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      time: Date.now()
    };
    
    if (!db.comments[params.id]) {
      db.comments[params.id] = [];
    }
    db.comments[params.id].push(newComment);
    
    // 只保留最近50条
    if (db.comments[params.id].length > 50) {
      db.comments[params.id] = db.comments[params.id].slice(-50);
    }
    
    jsonRes(res, { code: 0, data: newComment });
  },
  
  // ========== 礼物模块 ==========
  
  // 获取礼物列表
  'GET /api/gifts/list': async (req, res) => {
    jsonRes(res, { code: 0, data: db.gifts });
  },
  
  // 送礼物
  'POST /api/gifts/send': async (req, res) => {
    const body = await parseBody(req);
    const { streamId, giftId, amount = 1 } = body;
    
    if (!streamId || !giftId) {
      return jsonRes(res, { code: 400, message: 'streamId and giftId required' }, 400);
    }
    
    const gift = db.gifts.find(g => g.id === giftId);
    if (!gift) {
      return jsonRes(res, { code: 404, message: 'Gift not found' }, 404);
    }
    
    const stream = db.streams.find(s => s.id === streamId);
    if (!stream) {
      return jsonRes(res, { code: 404, message: 'Stream not found' }, 404);
    }
    
    const totalCost = gift.price * amount;
    
    // 检查余额
    if (db.wallets['current_user'].balance < totalCost) {
      return jsonRes(res, { code: 400, message: 'Insufficient balance' }, 400);
    }
    
    // 扣款
    db.wallets['current_user'].balance -= totalCost;
    
    // 记录（90%给主播，10%平台）
    const toStreamer = totalCost * 0.9;
    const toPlatform = totalCost * 0.1;
    
    jsonRes(res, {
      code: 0,
      data: {
        gift,
        amount,
        totalCost,
        streamerEarnings: toStreamer,
        platformFee: toPlatform,
        remainingBalance: db.wallets['current_user'].balance,
        message: `Sent ${amount}x ${gift.icon} to ${stream.streamerName}!`
      }
    });
  },
  
  // ========== 关注模块 ==========
  
  // 关注/取消关注
  'POST /api/follow/:userId': async (req, res, params) => {
    const { action } = await parseBody(req);
    const targetUserId = params.userId;
    const currentUser = 'current_user';
    
    if (!db.follows[currentUser]) {
      db.follows[currentUser] = [];
    }
    
    const isFollowing = db.follows[currentUser].includes(targetUserId);
    
    if (action === 'unfollow' && isFollowing) {
      // 取消关注
      db.follows[currentUser] = db.follows[currentUser].filter(id => id !== targetUserId);
      jsonRes(res, { code: 0, data: { following: false } });
    } else if (!isFollowing) {
      // 关注
      db.follows[currentUser].push(targetUserId);
      jsonRes(res, { code: 0, data: { following: true } });
    } else {
      jsonRes(res, { code: 0, data: { following: true, message: 'Already following' } });
    }
  },
  
  // 检查关注状态
  'GET /api/follow/:userId/status': async (req, res, params) => {
    const isFollowing = db.follows['current_user'].includes(params.userId);
    jsonRes(res, { code: 0, data: { following: isFollowing } });
  },
  
  // ========== 钱包模块 ==========
  
  // 获取余额
  'GET /api/wallet/balance': async (req, res) => {
    jsonRes(res, { code: 0, data: db.wallets['current_user'] });
  },
  
  // ========== 用户认证模块 ==========
  
  // 注册
  'POST /api/auth/register': handleRegister,
  
  // 登录
  'POST /api/auth/login': handleLogin,
  
  // 登出（需要认证）
  'POST /api/auth/logout': async (req, res) => {
    authMiddleware(req, res, () => handleLogout(req, res));
  },
  
  // 获取当前用户信息（需要认证）
  'GET /api/auth/me': async (req, res) => {
    authMiddleware(req, res, () => handleGetMe(req, res));
  },
  
  // 更新用户信息（需要认证）
  'PUT /api/users/profile': async (req, res) => {
    authMiddleware(req, res, () => handleUpdateProfile(req, res));
  },
  
  // 修改密码（需要认证）
  'PUT /api/auth/password': async (req, res) => {
    authMiddleware(req, res, () => handleChangePassword(req, res));
  },
  
  // 申请主播认证（需要认证）
  'POST /api/users/verification': async (req, res) => {
    authMiddleware(req, res, () => handleVerification(req, res));
  },
  
  // 获取认证状态（需要认证）
  'GET /api/users/verification/status': async (req, res) => {
    authMiddleware(req, res, () => handleGetVerificationStatus(req, res));
  },
  
  // 审核主播认证（管理员接口）
  'POST /api/admin/verification/approve': async (req, res) => {
    authMiddleware(req, res, () => handleApproveVerification(req, res));
  },
  
  // ==================== 直播模块 ====================
  
  // 创建直播间（需要认证）
  'POST /api/streams/create': async (req, res) => {
    authMiddleware(req, res, () => handleCreateStream(req, res));
  },
  
  // 结束直播（需要认证）
  'POST /api/streams/end': async (req, res) => {
    authMiddleware(req, res, () => handleEndStream(req, res));
  },
  
  // 获取直播间信息
  'GET /api/streams/:id/info': async (req, res, params) => {
    handleGetStreamInfo(req, res, params);
  },
  
  // 获取直播列表（带播放地址）
  'GET /api/streams/live': async (req, res) => {
    handleGetLiveStreams(req, res);
  },
  
  // ========== 首页模块 ==========
  
  // 获取Banner列表
  'GET /api/banners': async (req, res) => {
    const banners = [
      {
        id: '1',
        imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
        title: '🎉 新人开播奖励翻倍！',
        actionType: 'task',
        actionUrl: '/tasks',
      },
      {
        id: '2',
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
        title: '📍 探索北京胡同文化',
        actionType: 'live',
        actionUrl: '/live/beijing',
      },
      {
        id: '3',
        imageUrl: 'https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=800',
        title: '💰 今日最高收益 $1,234',
        actionType: 'web',
        actionUrl: '/ranking',
      },
    ];
    jsonRes(res, { code: 0, data: banners });
  },
  
  // 获取关注的主播列表
  'GET /api/followed-streamers': async (req, res) => {
    const currentUser = 'current_user';
    const followedIds = db.follows[currentUser] || [];
    
    const streamers = followedIds.map(userId => {
      const user = db.users.find(u => u.id === userId);
      if (!user) return null;
      
      // 检查是否正在直播
      const liveStream = db.streams.find(s => s.streamerId === userId && s.isLive);
      
      return {
        id: userId,
        username: user.name,
        avatar: user.avatar,
        isLive: !!liveStream,
        title: liveStream?.title || '',
        viewers: liveStream?.viewers?.toString() || '0',
        streamId: liveStream?.id || '',
      };
    }).filter(Boolean);
    
    jsonRes(res, { code: 0, data: streamers });
  },
  
  // 获取混合内容流（直播+回放+视频）
  'GET /api/mixed-content': async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const filter = parsedUrl.query.filter || 'recommend';
    const limit = parseInt(parsedUrl.query.limit) || 20;
    
    // 构建混合内容
    const mixedContent = [];
    
    // 1. 添加正在直播的内容
    const liveStreams = db.streams
      .filter(s => s.isLive)
      .map(s => ({
        id: s.id,
        type: 'live',
        title: s.title,
        author: s.streamerName,
        thumbnailUrl: s.thumbnail,
        viewers: s.viewers.toString(),
        isLive: true,
        location: s.location,
      }));
    
    // 2. 添加模拟的回放/视频内容
    const videoContent = [
      {
        id: 'v1',
        type: 'video',
        title: '成都街头小吃攻略，人均20吃到撑',
        author: '@成都吃货王',
        thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
        likes: '2.3k',
        duration: '03:45',
      },
      {
        id: 'v2',
        type: 'replay',
        title: '西安城墙骑行全记录',
        author: '@西安美食家',
        thumbnailUrl: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=400',
        viewers: '5.6k',
        duration: '45:20',
      },
      {
        id: 'v3',
        type: 'video',
        title: '西湖十景最佳拍摄点',
        author: '@杭州西湖妹',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400',
        likes: '1.8k',
        duration: '02:30',
      },
    ];
    
    // 根据筛选条件调整内容
    if (filter === 'live') {
      mixedContent.push(...liveStreams);
    } else if (filter === 'video') {
      mixedContent.push(...videoContent);
    } else {
      // 推荐模式：混合排列
      const maxItems = Math.max(liveStreams.length, videoContent.length);
      for (let i = 0; i < maxItems; i++) {
        if (liveStreams[i]) mixedContent.push(liveStreams[i]);
        if (videoContent[i]) mixedContent.push(videoContent[i]);
      }
    }
    
    // 限制数量
    const result = mixedContent.slice(0, limit);
    
    jsonRes(res, { code: 0, data: result, total: result.length });
  },
  
  // 获取快捷入口配置
  'GET /api/quick-entries': async (req, res) => {
    const entries = [
      { id: '1', icon: '📍', label: '附近', filter: 'nearby' },
      { id: '2', icon: '🔥', label: '热门', filter: 'hot' },
      { id: '3', icon: '⭐', label: '新人', filter: 'new' },
      { id: '4', icon: '🎯', label: '推荐', filter: 'recommend' },
      { id: '5', icon: '🎁', label: '活动', filter: 'activity' },
    ];
    jsonRes(res, { code: 0, data: entries });
  },
};

// ==================== HTTP服务器 ====================

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 匹配API路由
  let matched = false;
  
  for (const [routeKey, handler] of Object.entries(routes)) {
    const [method, routePath] = routeKey.split(' ');
    
    if (req.method !== method) continue;
    
    // 处理带参数的路由 /api/streams/:id
    const routeRegex = routePath.replace(/:([^/]+)/g, '([^/]+)');
    const regex = new RegExp(`^${routeRegex}$`);
    const match = pathname.match(regex);
    
    if (match) {
      matched = true;
      
      // 提取参数
      const params = {};
      const paramNames = routePath.match(/:([^/]+)/g);
      if (paramNames) {
        paramNames.forEach((name, i) => {
          params[name.slice(1)] = match[i + 1];
        });
      }
      
      try {
        await handler(req, res, params);
      } catch (err) {
        console.error('API Error:', err);
        jsonRes(res, { code: 500, message: 'Internal server error' }, 500);
      }
      break;
    }
  }
  
  if (!matched) {
    // 静态文件服务
    let filePath = path.join('/workspace/projects/dev-environment/flutter-app', 
      pathname === '/' ? 'prototype_preview.html' : pathname);
    
    const extname = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentTypes[extname] || 'application/octet-stream' });
        res.end(content);
      }
    });
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://192.168.124.11:${PORT}/`);
  console.log('');
  console.log('📚 API文档:');
  console.log('');
  console.log('【用户认证】');
  console.log('  POST /api/auth/register       - 用户注册');
  console.log('  POST /api/auth/login          - 用户登录');
  console.log('  POST /api/auth/logout         - 用户登出');
  console.log('  GET  /api/auth/me             - 获取当前用户');
  console.log('  PUT  /api/users/profile       - 更新用户信息');
  console.log('  PUT  /api/auth/password       - 修改密码');
  console.log('  POST /api/users/verification  - 申请主播认证');
  console.log('');
  console.log('【直播】');
  console.log('  GET  /api/health              - 健康检查');
  console.log('  GET  /api/streams             - 直播列表');
  console.log('  GET  /api/streams/:id         - 直播间详情');
  console.log('  GET  /api/streams/:id/comments - 获取评论');
  console.log('  POST /api/streams/:id/comments - 发送评论');
  console.log('  GET  /api/gifts/list          - 礼物列表');
  console.log('  POST /api/gifts/send          - 送礼物');
  console.log('  POST /api/follow/:userId      - 关注/取关');
  console.log('  GET  /api/wallet/balance      - 查询余额');
  console.log('');
  console.log('💰 默认钱包余额: $888.88');
});

module.exports = { db };