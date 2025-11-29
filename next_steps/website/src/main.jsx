import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, sepolia, polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Define Ionova Devnet Chain
const ionovaDevnet = {
  id: 31337,
  name: 'Ionova Devnet',
  network: 'ionova-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ionova',
    symbol: 'IONX',
  },
  rpcUrls: {
    default: { http: ['http://72.61.210.50:27000'] },
    public: { http: ['http://72.61.210.50:27000'] },
  },
};

// Create wagmi config (Wagmi v2)
const config = createConfig({
  chains: [mainnet, sepolia, polygon, ionovaDevnet],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [ionovaDevnet.id]: http(),
  },
});

// Create react-query client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
