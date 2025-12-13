# Quick Ionova Website Deployment Guide

## Current Situation
The automated deployment is having issues with SSH password authentication. Here's the manual approach:

## Simple 3-Step Deployment

### Step 1: Open a new PowerShell window

### Step 2: Navigate to the project
```powershell
cd f:\ionova
```

### Step 3: Copy files to VPS
```powershell
scp -r next_steps\website\dist\* root@72.61.210.50:/var/www/html/
```

When prompted, enter password: `Exitofxtrade1211#`

## What This Does
- Copies all built website files directly to `/var/www/html/`
- Website becomes live immediately at http://72.61.210.50/
- No need for Nginx restart (files are in the correct location)

## Expected Result
After successful copy, visit http://72.61.210.50/ and you should see:
- New hero section: "The Future-Proof Blockchain"
- Quantum-safe badge
- Feature cards
- L1 comparison table
- Multi-source burn visualization
- Oracle governance demo

## Alternative: Use WinSCP
If command line issues persist:
1. Download WinSCP (free SFTP client)
2. Connect to 72.61.210.50 with root credentials
3. Navigate to `/var/www/html/`
4. Delete all files in that directory
5. Copy all files from `f:\ionova\next_steps\website\dist\` to `/var/www/html/`

## Verification
After deployment, check:
- http://72.61.210.50/ loads
- Page title shows: "Ionova | Quantum-Safe 500K TPS Blockchain"
- Hero section displays quantum-safe messaging
