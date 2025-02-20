import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, http } from 'wagmi';

// Define Lisk Sepolia chain
export const liskMainnet = {
    id: 1135,
    name: 'Lisk',
    nativeCurrency: { name: 'LSK', symbol: 'LSK', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.api.lisk.com'] },
        public: { http: ['https://rpc.api.lisk.com'] },
    },
    blockExplorers: {
        default: { name: 'LiskScout', url: 'https://blockscout.lisk.com' },
    },
    testnet: false,
} as const;

export const config = createConfig({
    chains: [liskMainnet],
    transports: {
        [liskMainnet.id]: http(),
    },
});