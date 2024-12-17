'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { publicClient, getWalletClient, SNAKE_GAME_ADDRESS } from '../web3/config';
import WalletButton from './WalletButton';
import { LeaderboardEntry, FoodParticle, SnakeSegment, Food, Direction } from '../types/game';
import SnakeGameABI from '../web3/abi/SnakeGame.json';
import ULOTokenABI from '../web3/abi/ULOToken.json';
import toast from 'react-hot-toast';

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
  const [particles, setParticles] = useState<FoodParticle[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Game constants
  const CANVAS_SIZE = 600;
  const GRID_SIZE = 25;
  const BASE_SPEED = 150;
  const MAX_LEVEL = 5; // Reduced to 5 levels

  // Level information
  const getLevelInfo = (level: number) => {
    const infos = {
      1: { name: "Beginner", speed: "Slow", points: "1x" },
      2: { name: "Intermediate", speed: "Medium", points: "2x" },
      3: { name: "Advanced", speed: "Fast", points: "3x" },
      4: { name: "Expert", speed: "Very Fast", points: "4x" },
      5: { name: "Master", speed: "Insane", points: "5x" }
    };
    return infos[level as keyof typeof infos];
  };

  // Get snake speed based on level
  const getSnakeSpeed = () => {
    return BASE_SPEED - (level - 1) * 25; // Adjusted speed difference
  };

  // Get random color for particles
  const getRandomColor = () => {
    const colors = ['#ff0000', '#ff3333', '#ff6666', '#ff9999'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Create food particles
  const createFoodParticles = (x: number, y: number) => {
    const particles: FoodParticle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      particles.push({
        x: x * GRID_SIZE + GRID_SIZE / 2,
        y: y * GRID_SIZE + GRID_SIZE / 2,
        dx: Math.cos(angle) * 2,
        dy: Math.sin(angle) * 2,
        alpha: 1,
        color: getRandomColor(),
        life: 1
      });
    }
    setParticles(particles);
  };

  // Update and draw particles
  const updateParticles = () => {
    setParticles(prevParticles => 
      prevParticles
        .map(p => ({
          ...p,
          x: p.x + p.dx,
          y: p.y + p.dy,
          life: p.life - 0.02,
          dx: p.dx * 0.98,
          dy: p.dy * 0.98
        }))
        .filter(p => p.life > 0)
    );
  };

  // Start game with smart contract
  const startGame = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
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
    } catch (error: any) {
      console.error('Error starting game:', error);
      alert(`Failed to start game: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
  };

  const submitScoreAndMint = async () => {
    if (!address || isMinting) return;
    
    try {
      setIsMinting(true);
      
      // Get wallet client
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
      
      // Wait for transaction and update UI
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        toast.success('Score submitted and tokens minted successfully!');
        // Refresh leaderboard after successful minting
        await fetchLeaderboard();
        // Return to main menu
        backToMenu();
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Error submitting score:', error);
      toast.error(error?.message || 'Failed to submit score');
    } finally {
      setIsMinting(false);
    }
  };

  const backToMenu = () => {
    setGameStarted(false);
    setGameOver(false);
  };

  const fetchLeaderboard = async () => {
    if (!publicClient) return;
    
    try {
      setIsLoadingLeaderboard(true);
      const data = (await publicClient.readContract({
        address: SNAKE_GAME_ADDRESS,
        abi: SnakeGameABI.abi,
        functionName: 'getRecentScores',
        args: [level, 10n], // Get top 10 scores
      })) as LeaderboardEntry[];

      // Format and sort the leaderboard data
      const formattedData = data.map((entry) => ({
        ...entry,
        score: Number(entry.score),
        timestamp: Number(entry.timestamp),
      }));

      setLeaderboard(formattedData);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast.error(error?.message || 'Failed to fetch leaderboard');
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
    drawGame();
  }, []);

  // Game loop with particle updates
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameInterval = setInterval(() => {
      gameLoop();
      updateParticles();
    }, getSnakeSpeed());
    
    return () => clearInterval(gameInterval);
  }, [snake, food, direction, gameStarted, gameOver, level, particles]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      switch (e.key.toLowerCase()) {
        case 'w':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 's':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'a':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'd':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, direction]);

  const gameLoop = () => {
    if (!canvasRef.current || gameOver) return;

    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    switch (direction) {
      case 'UP':
        head.y = (head.y - 1 + CANVAS_SIZE / GRID_SIZE) % (CANVAS_SIZE / GRID_SIZE);
        break;
      case 'DOWN':
        head.y = (head.y + 1) % (CANVAS_SIZE / GRID_SIZE);
        break;
      case 'LEFT':
        head.x = (head.x - 1 + CANVAS_SIZE / GRID_SIZE) % (CANVAS_SIZE / GRID_SIZE);
        break;
      case 'RIGHT':
        head.x = (head.x + 1) % (CANVAS_SIZE / GRID_SIZE);
        break;
    }

    // Check only for self-collision
    if (checkCollision(head)) {
      handleGameOver();
      return;
    }

    if (head.x === food.x && head.y === food.y) {
      setScore(score + (level * 10));
      createFoodParticles(food.x, food.y);
      generateFood();
    } else {
      newSnake.pop();
    }

    newSnake.unshift(head);
    setSnake(newSnake);
    drawGame();
  };

  const generateFood = () => {
    let newFood: { x: number; y: number };
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  };

  const checkCollision = (head: { x: number; y: number }) => {
    return snake.slice(1).some((segment) => segment.x === head.x && segment.y === head.y);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = '#222222';
    for (let i = 0; i < CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw snake with gradient
    snake.forEach(({ x, y }, index) => {
      const gradient = ctx.createLinearGradient(
        x * GRID_SIZE,
        y * GRID_SIZE,
        (x + 1) * GRID_SIZE,
        (y + 1) * GRID_SIZE
      );
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(1, '#008800');
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = index === 0 ? 10 : 5;
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
      ctx.shadowBlur = 0;
    });

    // Draw food with glow effect
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-700">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Game Over!</h2>
            <div className="space-y-4">
              <div>
                <p className="text-2xl mb-2">Score: <span className="text-green-400">{score}</span></p>
                <p className="text-xl mb-4">Level {level} - {getLevelInfo(level).name}</p>
              </div>
              
              {/* Player Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter your name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isMinting}
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={submitScoreAndMint}
                  disabled={isMinting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isMinting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting & Minting...
                    </span>
                  ) : (
                    'Submit Score & Get Tokens'
                  )}
                </button>
                
                <button
                  onClick={backToMenu}
                  disabled={isMinting}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl">
      <div className="flex justify-end mb-4">
    <WalletButton />
  </div>
        <h1 className="text-6xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
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
            <div className="w-full bg-gray-800/50 p-6 rounded-lg backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Level {level} Leaderboard
              </h2>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg border border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-blue-400">#{index + 1}</span>
                      <span className="font-bold">{entry.playerName}</span>
                    </div>
                    <span className="text-green-400 font-bold">{entry.score} pts</span>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    No scores yet for this level
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
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
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
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p><span className="text-blue-400">Difficulty:</span> {getLevelInfo(level).name}</p>
                    <p><span className="text-purple-400">Speed:</span> {getLevelInfo(level).speed}</p>
                    <p><span className="text-pink-400">Points Multiplier:</span> {getLevelInfo(level).points}</p>
                  </div>
                  <button
                    onClick={startGame}
                    disabled={!playerName}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full disabled:opacity-50 hover:from-blue-600 hover:to-pink-600 transition-all text-lg"
                  >
                    Start Game
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