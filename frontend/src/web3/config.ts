import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { liskSepolia } from '../lib/wagmi';
import SnakeGameABI from './abi/SnakeGame.json';

export const SNAKE_GAME_ADDRESS = '0x1F22c2b401a55d5165A800b755faa6f95a4D0842'; // Add your deployed contract address here

export const publicClient = createPublicClient({
    chain: liskSepolia,
    transport: http()
});

export const getWalletClient = () => {
    if (!window.ethereum) throw new Error('No MetaMask found');
    return createWalletClient({
        chain: liskSepolia,
        transport: custom(window.ethereum)
    });
};