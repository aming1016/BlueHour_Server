const { generateLiveUrls, generateStreamId } = require('./live');
const { dbUtils } = require('./db');

// 创建直播间
async function handleCreateStream(req, res) {
  const user = req.user;
  const { title, location, category } = await parseBody(req);
  
  if (!title) {
    return jsonRes(res, { code: 400, message: '直播标题不能为空' }, 400);
  }
  
  try {
    // 生成直播间ID和推流地址
    const streamId = generateStreamId(user.id);
    const urls = generateLiveUrls(streamId, 7200); // 2小时有效期
    
    // 保存直播间信息到数据库
    const streamData = {
      id: streamId,
      title: title,
      streamer_id: user.id,
      streamer_name: user.username || user.email,
      location: location || '',
      category: category || '其他',
      status: 'live', // live, ended
      viewers: 0,
      push_url: urls.push,
      play_url_flv: urls.play.flv,
      play_url_hls: urls.play.hls,
      created_at: new Date().toISOString(),
    };
    
    // 保存到数据库（这里简化，实际应该创建streams表）
    // await dbUtils.createStream(streamData);
    
    // 更新用户直播统计
    await dbUtils.updateUser(user.id, {
      total_lives: (user.total_lives || 0) + 1,
    });
    
    return jsonRes(res, {
      code: 0,
      message: '直播间创建成功',
      data: {
        stream_id: streamId,
        title: title,
        push_url: urls.push,  // 主播推流用
        play_url: urls.play.flv,  // 观众播放用
        expire_time: urls.expireTime,
      }
    });
  } catch (err) {
    console.error('Create stream error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 结束直播
async function handleEndStream(req, res) {
  const user = req.user;
  const { stream_id } = await parseBody(req);
  
  try {
    // 更新直播间状态
    // await dbUtils.updateStream(stream_id, { status: 'ended', ended_at: new Date().toISOString() });
    
    return jsonRes(res, {
      code: 0,
      message: '直播已结束',
      data: {
        stream_id: stream_id,
        duration: 3600, // TODO: 计算实际时长
        max_viewers: 100, // TODO: 统计实际人数
      }
    });
  } catch (err) {
    console.error('End stream error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 获取直播间信息
async function handleGetStreamInfo(req, res, params) {
  try {
    const streamId = params.id;
    
    // 查询直播间信息
    // const stream = await dbUtils.getStreamById(streamId);
    
    // 生成播放地址（如果已过期则重新生成）
    const urls = generateLiveUrls(streamId, 7200);
    
    return jsonRes(res, {
      code: 0,
      data: {
        stream_id: streamId,
        play_url: urls.play.flv,
        viewers: Math.floor(Math.random() * 500), // 模拟观众数
      }
    });
  } catch (err) {
    console.error('Get stream info error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

// 获取直播列表（带推流地址）
async function handleGetLiveStreams(req, res) {
  try {
    // 从数据库获取正在直播的列表
    // const streams = await dbUtils.getLiveStreams();
    
    // 模拟数据
    const streams = [
      {
        id: 'live_u1_123456',
        title: '北京故宫直播',
        streamer_name: 'Alex',
        viewers: 234,
        play_url: generateLiveUrls('live_u1_123456').play.flv,
      },
      {
        id: 'live_u2_123457',
        title: '上海外滩夜景',
        streamer_name: 'Maria',
        viewers: 189,
        play_url: generateLiveUrls('live_u2_123457').play.flv,
      },
    ];
    
    return jsonRes(res, {
      code: 0,
      data: streams,
    });
  } catch (err) {
    console.error('Get live streams error:', err);
    return jsonRes(res, { code: 500, message: '服务器错误' }, 500);
  }
}

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

module.exports = {
  handleCreateStream,
  handleEndStream,
  handleGetStreamInfo,
  handleGetLiveStreams,
};
