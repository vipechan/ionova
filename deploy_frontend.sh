#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Frontend Deployment..."

# 1. Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# 2. Deploy to Nginx
echo "deploying to /var/www/html..."
rm -rf /var/www/html/*
# Ensure directory exists
mkdir -p /var/www/html
# Copy from temp location
cp -r /root/dist_temp/* /var/www/html/

# 3. Configure Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/default << EOL
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy RPC requests to avoid CORS
    location /rpc {
        proxy_pass http://localhost:27000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# 4. Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo "✅ Frontend Deployed Successfully!"
echo "🌍 Access it at http://72.61.210.50"
