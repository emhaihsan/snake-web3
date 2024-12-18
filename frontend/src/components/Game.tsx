'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { publicClient, getWalletClient, SNAKE_GAME_ADDRESS} from '../web3/config';
import WalletButton from './WalletButton';
import { LeaderboardEntry, SnakeSegment, Food, Direction } from '../types/game';
import SnakeGameABI from '../web3/abi/SnakeGame.json';
import { getLevelInfo } from '@/constant/levels';
import { calculateSnakeSpeed } from '@/utils/speed';
import { useParticles } from '@/hooks/useParticles';
import { useGameRenderer } from '@/hooks/useGameRenderer';
import { useGameLogic } from '@/hooks/useGameLogic';

type ContractError = {
  message?: string;
  shortMessage?: string;
  cause?: unknown;
};

export default function Game() {
  const { address, isConnected } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [snake, setSnake] = useState<SnakeSegment[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Food>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [leaderboardSize, setLeaderboardSize] = useState(10);

  // Game constants
  const CANVAS_SIZE = 600;
  const GRID_SIZE = 25;
  const MAX_LEVEL = 5; 

  const { particles, createFoodParticles, updateParticles } = useParticles(GRID_SIZE);
  const getSnakeSpeed = calculateSnakeSpeed(level);
  const { drawGame, generateFood } = useGameRenderer({
    canvasRef,
    CANVAS_SIZE,
    GRID_SIZE,
    snake,
    food,
    particles,
  });

  const updateGameState = useCallback((updates: Partial<{
    snake: SnakeSegment[];
    food: Food;
    direction: Direction;
    score: number;
    gameOver: boolean;
    gameStarted: boolean;
    level: number;
  }>) => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'snake':
          setSnake(value as SnakeSegment[]);
          break;
        case 'food':
          setFood(value as Food);
          break;
        case 'direction':
          setDirection(value as Direction);
          break;
        case 'score':
          setScore(value as number);
          break;
        case 'gameOver':
          setGameOver(value as boolean);
          break;
        case 'gameStarted':
          setGameStarted(value as boolean);
          break;
        case 'level':
          setLevel(value as number);
          break;
      }
    });
  }, []);

  const handleGameOver = () => {
    setGameOver(true);
  };

  useGameLogic({
    gameState: {
      snake,
      food,
      direction,
      score,
      gameOver,
      gameStarted,
      level
    },
    CANVAS_SIZE,
    GRID_SIZE,
    updateGameState,
    createFoodParticles,
    generateFood,
    handleGameOver,
    updateParticles,
    drawGame,
    getSnakeSpeed
  });

  // Start game with smart contract
  const startGame = async () => {
    if (!isConnected || isStarting) return;
    
    try {
      setIsStarting(true);
      const walletClient = await getWalletClient();
      if (!walletClient) {
        throw new Error('Wallet client not initialized');
      }

      const { request } = await publicClient.simulateContract({
        address: SNAKE_GAME_ADDRESS,
        abi: SnakeGameABI.abi,
        functionName: 'startGame',
        args: [Number(level)],
        account: address,
      });
      
      const hash = await walletClient.writeContract(request);
      console.log('Game started, transaction hash:', hash);
      
      // Initialize game state
      setSnake([{ x: 10, y: 10 }]);
      setFood({ x: 5, y: 5 });
      setDirection('RIGHT');
      setScore(0);
      setGameOver(false);
      setGameStarted(true);
      setPlayerName(''); // Reset player name when starting new game
    } catch (error) {
      const contractError = error as ContractError;
      console.error('Error starting game:', contractError);
      alert(`Failed to start game: ${contractError?.message || contractError?.shortMessage || 'Unknown error'}`);
    } finally {
      setIsStarting(false);
    }
  };



  const submitScoreAndMint = async () => {
    if (!address || isMinting) return;
    
    try {
      setIsMinting(true);
      
      const walletClient = await getWalletClient();
      if (!walletClient) {
        throw new Error('Wallet client not initialized');
      }

      const { request } = await publicClient.simulateContract({
        address: SNAKE_GAME_ADDRESS,
        abi: SnakeGameABI.abi,
        functionName: 'submitScore',
        args: [playerName || '', BigInt(score), level],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        alert(`🎉 Score submitted successfully!\n\n🎮 Game Score: ${score}\n🪙 ULO Tokens Earned: ${score}\n\nTransaction Hash: ${hash}`);
        
        // Refresh leaderboard after successful minting
        await fetchLeaderboard();
        // Return to main menu
        setGameOver(false);
        setGameStarted(false);
      } else {
        alert('Transaction failed');
      }
    } catch (error) {
      const contractError = error as ContractError;
      console.error('Error submitting score:', contractError);
      alert(contractError?.message || contractError?.shortMessage || 'Failed to submit score');
    } finally {
      setIsMinting(false);
    }
  };

  const backToMenu = () => {
    setGameStarted(false);
    setGameOver(false);
  };

  const fetchLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true);
      const data = (await publicClient.readContract({
        address: SNAKE_GAME_ADDRESS,
        abi: SnakeGameABI.abi,
        functionName: 'getRecentScores',
        args: [level, BigInt(leaderboardSize)],
      })) as LeaderboardEntry[];

      // Format and sort the leaderboard data
      const formattedData = data
        .map((entry) => ({
          ...entry,
          score: Number(entry.score),
          timestamp: Number(entry.timestamp),
        }))
        .sort((a, b) => b.score - a.score);

      setLeaderboard(formattedData);
    } catch (error) {
      const contractError = error as ContractError;
      console.error('Error fetching leaderboard:', contractError);
      alert(contractError?.message || contractError?.shortMessage || 'Failed to fetch leaderboard');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchLeaderboard();
    }
  }, [level, isConnected]);

  useEffect(() => {
    fetchLeaderboard();
  }, [level, publicClient]);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
            <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Game Over!</h2>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl mb-2">Score: <span className="text-green-400">{score}</span></p>
                <p className="text-gray-400">Level: {getLevelInfo(level).name} ({getLevelInfo(level).points} multiplier)</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Enter your name to be featured on the leaderboard! (optional)</p>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={32}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={submitScoreAndMint}
                  disabled={isMinting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isMinting ? 'Minting...' : 'Submit Score & Mint Tokens'}
                </button>
                <button
                  onClick={backToMenu}
                  disabled={isMinting}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  Return to Menu
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Submitting your score will mint {score} ULO tokens to your wallet!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl">
      <div className="flex justify-end mb-4">
    <WalletButton />
  </div>
        <h1 className="text-6xl font-bold mb-8 text-center bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Web3 Snake Game
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          {/* Game Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-20"></div>
              <div className="relative bg-gray-900 p-6 rounded-lg shadow-neon">
                <canvas 
                  ref={canvasRef} 
                  className="border-2 border-gray-700 rounded"
                />
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="mt-8" style={{ width: CANVAS_SIZE }}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                      🏆 Leaderboard
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setLeaderboardSize(size);
                          fetchLeaderboard();
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          leaderboardSize === size
                            ? 'bg-yellow-500 text-gray-900'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Top {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                {isLoadingLeaderboard ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className="flex flex-col bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700/70 transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-gray-900' :
                              index === 1 ? 'bg-gray-300 text-gray-900' :
                              index === 2 ? 'bg-yellow-700 text-white' :
                              'bg-gray-600 text-gray-300'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {entry.playerName || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-green-400 font-bold">
                              {entry.score} pts
                            </span>
                            <span className="text-xs text-gray-400">
                              Level {entry.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No scores yet. Be the first to play!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Game Controls & Level Selection */}
          <div className="space-y-4">
            {/* Game Info */}
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm">
              <div className="flex gap-6 items-center justify-center">
                <div className="text-2xl font-bold">
                  <span className="text-blue-400">Level: </span>
                  <span>{level}</span>
                </div>
                <div className="text-2xl font-bold">
                  <span className="text-green-400">Score: </span>
                  <span>{score}</span>
                </div>
              </div>
            </div>

            {/* Controls Info */}
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm text-center">
              <p>Use <span className="text-yellow-400">WASD</span> keys to control the snake</p>
            </div>

            {/* Level Selection */}
            {!gameStarted && (
              <div className="bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 text-center">Level Selection</h3>
                <div className="flex flex-col gap-4">
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Array.from({ length: MAX_LEVEL }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Level {i + 1} - {getLevelInfo(i + 1).name}
                      </option>
                    ))}
                  </select>
                  <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                    <p className="text-blue-400">🎮 {getLevelInfo(level).name} Mode</p>
                    <p className="text-purple-400">⚡ Speed: {getLevelInfo(level).speed}</p>
                    <p className="text-pink-400">💎 Points Multiplier: {getLevelInfo(level).points}</p>
                    <p className="text-gray-300 mt-2">{getLevelInfo(level).info}</p>
                    <p className="text-gray-400 text-sm mt-2">🎯 {getLevelInfo(level).controls}</p>
                  </div>
                  <button
                    onClick={startGame}
                    disabled={isStarting}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full hover:from-blue-600 hover:to-pink-600 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting...
                      </div>
                    ) : (
                      'Start Game'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}