# Travel Live 后端 - 本地部署指南

## 快速启动（Windows/Mac）

### 1. 安装 Node.js
- 下载：https://nodejs.org/ （建议 LTS 版本）
- 安装后验证：`node --version`

### 2. 解压代码
```bash
# Windows 用 PowerShell 或 Git Bash
# Mac 用终端
cd backend/
```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动服务

**Windows:**
```powershell
# 方式1: 直接启动
npm start

# 方式2: 后台运行（PowerShell）
Start-Process node -ArgumentList "server.js" -WindowStyle Hidden
```

**Mac/Linux:**
```bash
# 方式1: 直接启动
npm start

# 方式2: 后台运行
nohup node server.js > app.log 2>&1 &
```

### 5. 验证服务
浏览器访问：http://localhost:3000/api/health

预期返回：`{"status":"ok"}`

---

## API 地址

| 接口 | 地址 |
|------|------|
| 健康检查 | http://localhost:3000/api/health |
| 直播列表 | http://localhost:3000/api/streams |
| 用户注册 | POST http://localhost:3000/api/auth/register |
| 用户登录 | POST http://localhost:3000/api/auth/login |

---

## 停止服务

**Windows:**
```powershell
# 查找并结束进程
taskkill /F /IM node.exe
```

**Mac/Linux:**
```bash
# 查找进程
lsof -i :3000

# 结束进程
kill <PID>
```

---

## 文件说明

```
backend/
├── server.js       # 主程序
├── auth.js         # 用户认证模块
├── db.js           # 数据库模块
├── live.js         # 直播模块
├── package.json    # 依赖配置
├── travel.db       # SQLite数据库（自动创建）
└── README.md       # 本文件
```

---

## 常见问题

**Q: 端口3000被占用？**
A: 修改 server.js 第518行的 PORT 变量为其他端口，如 3001

**Q: 如何清空数据库？**
A: 删除 travel.db 文件，重启服务会自动重建

**Q: 如何修改腾讯云直播配置？**
A: 编辑 server.js 开头的配置项（推流域名、SecretId等）
