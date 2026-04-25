#!/usr/bin/env bash
set -euo pipefail

# CentOS 7 one-click deploy script for project1
# Usage:
#   bash deploy-centos7.sh
#
# Optional env:
#   APP_DIR=/opt/project1
#   APP_PORT=3000
#   SERVER_NAME=your-server.example.com

APP_DIR="${APP_DIR:-/opt/project1}"
APP_PORT="${APP_PORT:-3000}"
SERVER_NAME="${SERVER_NAME:-your-server.example.com}"
SERVICE_NAME="project1-api"

if [[ ! -d "$APP_DIR" ]]; then
  echo "[ERROR] APP_DIR not found: $APP_DIR"
  echo "Please upload project to server first."
  exit 1
fi

echo "[1/7] Install dependencies..."
yum -y install epel-release
yum -y install java-11-openjdk java-11-openjdk-devel maven nginx curl git
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
  yum -y install nodejs
fi

echo "[2/7] Show tool versions..."
java -version || true
mvn -version || true
node -v || true
npm -v || true

echo "[3/7] Build frontend..."
cd "$APP_DIR"
npm install
npm run build

echo "[4/7] Build backend..."
mvn -f server-java/pom.xml clean package -DskipTests

echo "[5/7] Configure systemd service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Project1 Spring Boot API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/java -jar ${APP_DIR}/server-java/target/server-java-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --server.port=${APP_PORT}
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

echo "[6/7] Configure nginx..."
cat > /etc/nginx/conf.d/project1.conf <<EOF
server {
    listen 80;
    server_name _;

    root ${APP_DIR}/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

nginx -t
systemctl enable nginx
systemctl restart nginx

echo "[7/7] Firewall and health check..."
if systemctl is-active firewalld >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --permanent --add-service=https || true
  firewall-cmd --reload || true
fi

echo "API health:"
curl -s "http://127.0.0.1:${APP_PORT}/api/health" || true
echo
echo "Service status:"
systemctl --no-pager status "${SERVICE_NAME}" || true
echo
echo "Done. Open: http://${SERVER_NAME}"
