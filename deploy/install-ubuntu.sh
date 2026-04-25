#!/usr/bin/env bash
# 在服务器上执行（Ubuntu 20.04/22.04 示例）。假设项目已解压到 /var/www/web-mainpei
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/web-mainpei}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "==> 项目目录: $APP_DIR"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "错误: 未找到 $APP_DIR/package.json，请先解压部署包到此目录。"
  exit 1
fi

echo "==> 安装 Node.js $NODE_MAJOR.x（若已安装可跳过）"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

cd "$APP_DIR"

echo "==> 安装依赖并构建前端"
npm ci
npm run build

echo "==> 移除开发依赖以减小体积（可选）"
npm prune --production

echo "==> 安装 PM2（若未安装）"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> 启动 / 重启 API"
pm2 delete web-mainpei-api 2>/dev/null || true
pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
pm2 save
sudo env PATH="$PATH:$(dirname "$(command -v node)")" pm2 startup systemd -u "$USER" --hp "$HOME" || true

echo "==> 安装 Nginx 并写入站点（需要 sudo）"
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi
sudo cp "$APP_DIR/deploy/web-mainpei.nginx.conf" /etc/nginx/sites-available/web-mainpei
sudo sed -i "s|root /var/www/web-mainpei/dist|root ${APP_DIR}/dist|g" /etc/nginx/sites-available/web-mainpei
sudo ln -sf /etc/nginx/sites-available/web-mainpei /etc/nginx/sites-enabled/
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "==> 放行 HTTP（若已启用 ufw）"
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 'Nginx Full' 2>/dev/null || true

echo "==> 完成。访问 http://你的服务器地址/ ，接口使用同域 /api"
echo "==> 生产环境请设置 JWT 后重启："
echo "    export JWT_SECRET='随机长字符串'"
echo "    pm2 restart web-mainpei-api --update-env && pm2 save"
