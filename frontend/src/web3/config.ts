import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { liskSepolia } from '../lib/wagmi';
import SnakeGameABI from './abi/SnakeGame.json';

export const SNAKE_GAME_ADDRESS = '0x9FD27a3BDD9325e5f7003C0E4A945940991ad3Be'; // Add your deployed contract address here

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