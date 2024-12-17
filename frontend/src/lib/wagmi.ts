import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, http } from 'wagmi';

// Define Lisk Sepolia chain
export const liskSepolia = {
    id: 4202,
    name: 'Lisk Sepolia',
    nativeCurrency: { name: 'LSK', symbol: 'LSK', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.sepolia-api.lisk.com'] },
        public: { http: ['https://rpc.sepolia-api.lisk.com'] },
    },
    blockExplorers: {
        default: { name: 'LiskScout', url: 'https://sepolia-explorer.lisk.com' },
    },
    testnet: true,
} as const;

export const config = createConfig({
    chains: [liskSepolia],
    transports: {
        [liskSepolia.id]: http(),
    },
});