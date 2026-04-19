/** PM2：在项目根目录执行 pm2 start deploy/ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'web-mainpei-api',
      cwd: __dirname + '/..',
      script: 'server/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        JSON_BODY_LIMIT: '25mb',
        // 生产环境务必改成随机长串：export JWT_SECRET=... 或在下方填写
        // JWT_SECRET: 'change-me',
      },
    },
  ],
}
