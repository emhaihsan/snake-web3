import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, http } from 'wagmi';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';

// Define Lisk Sepolia chain
const liskSepolia = {
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

const { wallets } = getDefaultWallets({
    appName: 'Snake Web3',
    projectId: '43504d655ed509fcaa690ba32b3c13aa',
});

export const config = createConfig({
    chains: [liskSepolia],
    transports: {
        [liskSepolia.id]: http(),
    },
});