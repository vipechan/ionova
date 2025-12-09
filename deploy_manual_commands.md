# Manual VPS Deployment Commands

## Quick Deployment Steps

### Step 1: Copy Deployment Script to VPS
```powershell
scp f:\ionova\deploy_frontend.sh root@72.61.210.50:/root/
```
**Password:** `Exitofxtrade1211#`

### Step 2: Create Temp Directory on VPS
```powershell
ssh root@72.61.210.50 "rm -rf /root/dist_temp && mkdir -p /root/dist_temp"
```
**Password:** `Exitofxtrade1211#`

### Step 3: Copy Built Files to VPS
```powershell
scp -r f:\ionova\next_steps\website\dist\* root@72.61.210.50:/root/dist_temp/
```
**Password:** `Exitofxtrade1211#`

### Step 4: Run Deployment Script on VPS
```powershell
ssh root@72.61.210.50 "bash /root/deploy_frontend.sh"
```
**Password:** `Exitofxtrade1211#`

---

## OR: Single SSH Session (Interactive)

```powershell
# 1. Connect to VPS
ssh root@72.61.210.50
# Password: Exitofxtrade1211#

# 2. Once connected, run these commands on VPS:
rm -rf /var/www/html/*
mkdir -p /var/www/html

# 3. Exit SSH
exit

# 4. Copy files from local machine
scp -r f:\ionova\next_steps\website\dist\* root@72.61.210.50:/var/www/html/
# Password: Exitofxtrade1211#

# 5. Connect again and configure Nginx
ssh root@72.61.210.50
# Password: Exitofxtrade1211#

# 6. Configure Nginx on VPS
cat > /etc/nginx/sites-available/default << 'EOL'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /rpc {
        proxy_pass http://localhost:27000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# 7. Restart Nginx
systemctl restart nginx

# 8. Verify
systemctl status nginx
ls -lah /var/www/html/
```

---

## Verification Commands

### Check if files are deployed
```powershell
ssh root@72.61.210.50 "ls -lah /var/www/html/"
```

### Check Nginx status
```powershell
ssh root@72.61.210.50 "systemctl status nginx"
```

### Test frontend access
Open browser: **http://72.61.210.50**

---

## Notes
- Password is required for each command
- Built files are in: `f:\ionova\next_steps\website\dist\`
- Frontend will be accessible at: http://72.61.210.50
- Total upload size: ~2.5 MB (should take 1-2 minutes on good connection)
