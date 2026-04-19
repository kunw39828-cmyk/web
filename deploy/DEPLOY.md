# 服务器部署说明（Node API + Nginx 静态站）

## 架构

- 前端：`npm run build` 生成 `dist/`，由 **Nginx** 直接提供静态文件。
- 接口：同域 **`/api`**，Nginx 反代到本机 **Node** `server/index.js`（默认端口 **3001**）。
- 生产环境请设置 **`JWT_SECRET`**（勿使用仓库默认值）。

## 一次性准备（Ubuntu 示例）

1. 将项目放到服务器，例如：`/var/www/web-mainpei`（若仍只有压缩包，先解压）。
2. 赋予脚本执行权限并执行：

   ```bash
   sudo chmod +x /var/www/web-mainpei/deploy/install-ubuntu.sh
   sudo APP_DIR=/var/www/web-mainpei /var/www/web-mainpei/deploy/install-ubuntu.sh
   ```

   或按脚本内步骤手动：`npm ci` → `npm run build` → `npm prune --production` → `pm2 start deploy/ecosystem.config.cjs`。

3. 安装并配置 Nginx：

   ```bash
   sudo apt-get update && sudo apt-get install -y nginx
   sudo cp /var/www/web-mainpei/deploy/web-mainpei.nginx.conf /etc/nginx/sites-available/web-mainpei
   sudo ln -sf /etc/nginx/sites-available/web-mainpei /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default   # 避免与 default 冲突（按需）
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. 防火墙放行 **80**（及后续 **443**）：

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

5. 设置 JWT 并重启 API：

   ```bash
   export JWT_SECRET="请改为随机长字符串"
   pm2 restart web-mainpei-api --update-env
   pm2 save
   ```

浏览器访问：`http://服务器IP/`。

## 更新版本

在本机重新打包上传后，在服务器：

```bash
cd /var/www/web-mainpei
tar -xzf /root/web-mainpei-deploy.tar.gz   # 路径按实际上传位置调整
npm ci && npm run build && npm prune --production
pm2 restart web-mainpei-api
sudo systemctl reload nginx
```

## HTTPS（可选）

使用 Let’s Encrypt（`certbot`）为域名申请证书，并在 Nginx 中增加 `listen 443 ssl` 配置。

## 使用 Java 后端代替 Node

若改为 Spring Boot 监听 **3000** 且仍由 Nginx 反代 `/api`，将 `web-mainpei.nginx.conf` 中 `proxy_pass` 改为 `http://127.0.0.1:3000`，并自行配置 MySQL、`application-prod.yml` 等；前端 **无需** 再单独 `npm run build` 以外的 `VITE_API_BASE_URL`（默认同域 `/api`）。
