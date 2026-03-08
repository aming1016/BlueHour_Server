// 测试推流地址生成
require('dotenv').config();
const { generateLiveUrls } = require('./live');

const streamId = 'live_u1_' + Date.now();
console.log('Stream ID:', streamId);
console.log('');

const urls = generateLiveUrls(streamId, 7200);
console.log('推流地址:');
console.log(urls.push);
console.log('');
console.log('播放地址:');
console.log('FLV:', urls.play.flv);
console.log('HLS:', urls.play.hls);
