# Travel Live API 文档

> 版本：v1.0
> 基础URL：`http://localhost:80`（开发环境）
> 数据格式：JSON

---

## 全局约定

### 响应格式
```json
{
  "code": 0,        // 0=成功，非0=错误码
  "data": {},       // 业务数据
  "message": ""     // 错误信息（code!=0时有）
}
```

### CORS支持
- 已开启跨域，Flutter可直接调用

---

## 1. 直播模块

### 1.1 获取直播列表

**接口**：`GET /api/streams`

**响应示例**：
```json
{
  "code": 0,
  "data": [
    {
      "id": "s1",
      "title": "Beijing Hutong Walk - 胡同里的老北京",
      "streamerName": "Alex",
      "streamerAvatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      "viewers": 234,
      "isLive": true,
      "thumbnail": "https://images.unsplash.com/photo-xxx?w=400",
      "location": "Beijing, China"
    }
  ],
  "total": 5
}
```

### 1.2 获取直播间详情

**接口**：`GET /api/streams/:id`

**参数**：
- `id` - 直播间ID（如：s1, s2, s3...）

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "id": "s1",
    "title": "Beijing Hutong Walk...",
    "streamerId": "u1",
    "streamerName": "Alex",
    "streamerAvatar": "...",
    "viewers": 234,
    "isLive": true,
    "thumbnail": "...",
    "location": "Beijing, China",
    "startedAt": "2026-03-05T13:13:11.687Z",
    "description": "Walking through...",
    "streamerFollowers": 1200,
    "isFollowing": true
  }
}
```

---

## 2. 评论模块

### 2.1 获取评论列表

**接口**：`GET /api/streams/:id/comments`

**响应示例**：
```json
{
  "code": 0,
  "data": [
    {
      "id": "c1",
      "userId": "u2",
      "userName": "Maria",
      "text": "Love the hutong vibe!",
      "time": 1772719691687,
      "userAvatar": "..."
    }
  ]
}
```

### 2.2 发送评论

**接口**：`POST /api/streams/:id/comments`

**请求参数**：
```json
{
  "text": "弹幕内容",
  "userId": "current_user"  // 可选，默认current_user
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "id": "c1772720021220",
    "userId": "current_user",
    "userName": "Guest",
    "text": "弹幕内容",
    "time": 1772720021220
  }
}
```

---

## 3. 礼物模块

### 3.1 获取礼物列表

**接口**：`GET /api/gifts/list`

**响应示例**：
```json
{
  "code": 0,
  "data": [
    {
      "id": "g1",
      "name": "Heart",
      "icon": "❤️",
      "price": 1,
      "animation": "float"
    },
    {
      "id": "g5",
      "name": "Crown",
      "icon": "👑",
      "price": 100,
      "animation": "shine"
    }
  ]
}
```

**礼物说明**：
| 礼物 | 图标 | 价格(USD) | 动画 |
|------|------|-----------|------|
| Heart | ❤️ | $1 | float |
| Flower | 🌸 | $5 | bloom |
| Star | ⭐ | $10 | sparkle |
| Rocket | 🚀 | $50 | fly |
| Crown | 👑 | $100 | shine |

### 3.2 送礼物

**接口**：`POST /api/gifts/send`

**请求参数**：
```json
{
  "streamId": "s1",
  "giftId": "g5",
  "amount": 1
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "gift": {
      "id": "g5",
      "name": "Crown",
      "icon": "👑",
      "price": 100
    },
    "amount": 1,
    "totalCost": 100,
    "streamerEarnings": 90,    // 主播得90%
    "platformFee": 10,         // 平台抽10%
    "remainingBalance": 788.88,
    "message": "Sent 1x 👑 to Alex!"
  }
}
```

**错误码**：
- `400` - 余额不足
- `404` - 礼物或直播间不存在

---

## 4. 关注模块

### 4.1 关注/取消关注

**接口**：`POST /api/follow/:userId`

**请求参数**：
```json
{
  "action": "follow"  // follow=关注, unfollow=取消关注
}
```

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "following": true  // 当前是否已关注
  }
}
```

### 4.2 检查关注状态

**接口**：`GET /api/follow/:userId/status`

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "following": true
  }
}
```

---

## 5. 钱包模块

### 5.1 查询余额

**接口**：`GET /api/wallet/balance`

**响应示例**：
```json
{
  "code": 0,
  "data": {
    "balance": 788.88,
    "currency": "USD"
  }
}
```

---

## 测试环境

### 测试直播间ID
- `s1` - Beijing Hutong Walk
- `s2` - Shanghai Night View
- `s3` - Chengdu Panda Base
- `s4` - Xi'an Ancient City Wall
- `s5` - Guilin Landscape

### 默认测试数据
- 初始余额：$888.88
- 默认用户：current_user

---

## Flutter调用示例

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

const String API_BASE = 'http://localhost:80';

// 获取直播列表
Future<List<dynamic>> fetchStreams() async {
  final response = await http.get(Uri.parse('$API_BASE/api/streams'));
  final data = jsonDecode(response.body);
  return data['data'];
}

// 发送评论
Future<void> sendComment(String streamId, String text) async {
  await http.post(
    Uri.parse('$API_BASE/api/streams/$streamId/comments'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'text': text}),
  );
}

// 送礼物
Future<Map<String, dynamic>> sendGift(String streamId, String giftId) async {
  final response = await http.post(
    Uri.parse('$API_BASE/api/gifts/send'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'streamId': streamId, 'giftId': giftId, 'amount': 1}),
  );
  return jsonDecode(response.body)['data'];
}
```

---

*文档生成时间：2026-03-05*