// 简单的服务器连接检查脚本
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'OPTIONS',
  timeout: 3000
};

console.log('正在检查后端服务器状态...');

const req = http.request(options, (res) => {
  console.log('✅ 后端服务器正在运行！');
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);
});

req.on('error', (e) => {
  console.error('❌ 无法连接到后端服务器');
  console.error('错误信息:', e.message);
  console.log('\n可能的解决方案：');
  console.log('1. 确保 MongoDB 已启动');
  console.log('2. 在 backend 目录运行: npm start');
  console.log('3. 检查端口 3000 是否被占用');
});

req.on('timeout', () => {
  console.error('❌ 连接超时');
  req.destroy();
});

req.end();

// 也检查 MongoDB
console.log('\n检查 MongoDB 连接...');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000
})
.then(() => {
  console.log('✅ MongoDB 连接成功！');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB 连接失败:', err.message);
  console.log('\n请确保 MongoDB 已启动：');
  console.log('- Windows: 运行 mongod 命令');
  console.log('- 或者使用 MongoDB Compass 启动服务');
  process.exit(1);
});