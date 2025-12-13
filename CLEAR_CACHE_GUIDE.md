# Clear Browser Cache - Updated Features Not Showing

The deployment was successful, but you're seeing old content due to browser caching. Follow these steps:

## Quick Fix (Choose One Method)

### Method 1: Hard Refresh (Fastest)
**Windows/Linux:**
- Press `Ctrl + Shift + R` or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

### Method 2: Clear Browser Cache
**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Refresh the page

### Method 3: Open in Incognito/Private Mode
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)
- Visit: http://72.61.210.50/sale

## Verify Changes Work

After clearing cache, test the KYC logic:

1. **Connect your wallet**
2. **Test with 100 fractions**: Should show purchase form (NO KYC)
3. **Test with 101 fractions**: Should show KYC warning

## What Was Updated

The Nginx configuration has been updated with cache-busting headers to prevent this issue in the future:
- `index.html` - No caching (always fresh)
- Static assets (JS/CSS) - Cached based on versioned filenames

## Still Not Working?

If you still see old content after hard refresh:

1. Check browser console (F12) for error messages
2. Try a different browser
3. Clear DNS cache: `ipconfig /flushdns` (Windows) in PowerShell
