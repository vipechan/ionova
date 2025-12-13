# Manual Deployment - Quick Guide

The frontend has been built successfully. Follow these steps in a **NEW PowerShell window**:

## Step 1: Copy Deployment Script
```powershell
scp f:\ionova\deploy_frontend.sh root@72.61.210.50:/root/
```
**Password:** `Exitofxtrade1211#`

## Step 2: Prepare VPS Directory
```powershell
ssh root@72.61.210.50 "rm -rf /root/dist_temp && mkdir -p /root/dist_temp"
```
**Password:** `Exitofxtrade1211#`

## Step 3: Copy Built Files to VPS
```powershell
scp -r f:\ionova\next_steps\website\dist\* root@72.61.210.50:/root/dist_temp/
```
**Password:** `Exitofxtrade1211#`

## Step 4: Run Deployment on VPS
```powershell
ssh root@72.61.210.50 "bash /root/deploy_frontend.sh"
```
**Password:** `Exitofxtrade1211#`

---

## Verification

After deployment completes, verify:

1. **Check deployment status:**
```powershell
ssh root@72.61.210.50 "systemctl status nginx"
```

2. **Open in browser:**
- http://72.61.210.50

---

## Note
- Each command requires the password once
- Total upload size: ~2.5 MB
- The validator sale page will be accessible at: http://72.61.210.50/sale
