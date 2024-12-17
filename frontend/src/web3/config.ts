import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { liskSepolia } from '../lib/wagmi';
import SnakeGameABI from './abi/SnakeGame.json';

export const SNAKE_GAME_ADDRESS = '0x405299799CB11A33B2Bcc6EfBA380FfC36392A6D'; // Add your deployed contract address here

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