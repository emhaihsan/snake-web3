import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { liskMainnet } from '../lib/wagmi';

export const SNAKE_GAME_ADDRESS = '0x3803d8099e9f78E05f0444e53f927083BE33375F'; // Add your deployed contract address here

export const publicClient = createPublicClient({
    chain: liskMainnet,
    transport: http()
});

export const getWalletClient = () => {
    if (!window.ethereum) throw new Error('No MetaMask found');
    return createWalletClient({
        chain: liskMainnet,
        transport: custom(window.ethereum)
    });
};