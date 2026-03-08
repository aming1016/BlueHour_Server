const crypto = require('crypto');

// 腾讯云直播推流地址生成
// 文档：https://cloud.tencent.com/document/product/267/32720

/**
 * 生成推流地址
 * @param {string} streamName - 流名称（直播间ID）
 * @param {number} expireTime - 过期时间（秒）
 * @returns {object} 推流和播放地址
 */
function generateLiveUrls(streamName, expireTime = 3600) {
  // 从环境变量读取配置
  const pushDomain = process.env.PUSH_DOMAIN || '228614.push.tlivecloud.com';
  const playDomain = process.env.PLAY_DOMAIN || '228614.play.tlivecloud.com';
  const appName = 'live'; // 腾讯云默认AppName是live
  const txTime = Math.floor(Date.now() / 1000) + expireTime;
  
  // 生成推流地址
  const pushUrl = generatePushUrl(pushDomain, appName, streamName, txTime);
  
  // 生成播放地址（FLV/HLS）
  const flvUrl = generatePlayUrl(playDomain, appName, streamName, txTime, 'flv');
  const hlsUrl = generatePlayUrl(playDomain, appName, streamName, txTime, 'm3u8');
  const rtmpUrl = generatePlayUrl(playDomain, appName, streamName, txTime, 'rtmp');
  
  return {
    push: pushUrl,
    play: {
      flv: flvUrl,
      hls: hlsUrl,
      rtmp: rtmpUrl,
    },
    expireTime: txTime,
  };
}

/**
 * 生成推流地址（带鉴权）
 */
function generatePushUrl(domain, appName, streamName, txTime) {
  // 如果配置了推流密钥，生成鉴权串
  const txSecret = process.env.PUSH_KEY || '';
  
  if (txSecret) {
    const txTimeHex = txTime.toString(16).toUpperCase();
    const authString = `/${appName}/${streamName}${txTimeHex}${txSecret}`;
    const txSecretHash = crypto.createHash('md5').update(authString).digest('hex');
    return `rtmp://${domain}/${appName}/${streamName}?txSecret=${txSecretHash}&txTime=${txTimeHex}`;
  }
  
  // 无鉴权模式（开发测试用）
  return `rtmp://${domain}/${appName}/${streamName}`;
}

/**
 * 生成播放地址（带鉴权）
 */
function generatePlayUrl(domain, appName, streamName, txTime, format) {
  const txSecret = process.env.PLAY_KEY || '';
  const ext = format === 'rtmp' ? '' : `.${format}`;
  
  if (txSecret) {
    const txTimeHex = txTime.toString(16).toUpperCase();
    const authString = `/${appName}/${streamName}${ext}${txTimeHex}${txSecret}`;
    const txSecretHash = crypto.createHash('md5').update(authString).digest('hex');
    
    if (format === 'rtmp') {
      return `rtmp://${domain}/${appName}/${streamName}?txSecret=${txSecretHash}&txTime=${txTimeHex}`;
    }
    return `https://${domain}/${appName}/${streamName}${ext}?txSecret=${txSecretHash}&txTime=${txTimeHex}`;
  }
  
  // 无鉴权模式
  if (format === 'rtmp') {
    return `rtmp://${domain}/${appName}/${streamName}`;
  }
  return `https://${domain}/${appName}/${streamName}${ext}`;
}

/**
 * 生成直播间ID
 */
function generateStreamId(userId) {
  const timestamp = Date.now();
  return `live_${userId}_${timestamp}`;
}

module.exports = {
  generateLiveUrls,
  generateStreamId,
};
