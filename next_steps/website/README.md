# Ionova Marketing Website

Modern, responsive landing page for Ionova blockchain.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Features

- Hero section with key metrics
- Technology overview
- Tokenomics calculator
- Interactive charts
- Wallet connection
- Airdrop claim modal
- Responsive design

## Tech Stack

- React 18
- Vite
- Tailwind CSS v4
- ethers.js
- Framer Motion (animations)

## Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### Custom Server (Nginx)
```bash
npm run build
cp -r dist/* /var/www/html/
```

## Environment Variables

Create `.env`:
```
VITE_RPC_URL=https://rpc.ionova.network
VITE_CHAIN_ID=1
VITE_AIRDROP_CONTRACT=0x...
```

## Customization

### Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#6366f1',
  secondary: '#8b5cf6'
}
```

### Content
Edit components in `src/components/`:
- `Hero.jsx` - Main banner
- `Features.jsx` - Key features
- `Tokenomics.jsx` - Token info
- `Ecosystem.jsx` - DeFi protocols

## Analytics

Add Google Analytics in `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

## SEO

Update `index.html` meta tags for better SEO.

## Support

- Discord: https://discord.gg/ionova
- Email: team@ionova.network
