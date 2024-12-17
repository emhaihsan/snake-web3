import { LeaderboardEntry } from '../types/game';

type Props = {
  entries: LeaderboardEntry[];
  onClose: () => void;
};

export default function Leaderboard({ entries, onClose }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={index} className="flex justify-between">
              <span>{entry.name}</span>
              <span>Level {entry.level}</span>
              <span>{entry.score} points</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}