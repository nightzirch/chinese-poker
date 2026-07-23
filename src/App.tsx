import type { Game, Player, PlayerRoundScore, EndCondition } from './types';
import { Setup } from './components/Setup';
import { Scoreboard } from './components/Scoreboard';
import { useLocalStorage } from './useLocalStorage';

export default function App() {
  const [games, setGames] = useLocalStorage<Game[]>('chinese-poker-games', []);
  const [currentGameId, setCurrentGameId] = useLocalStorage<string | null>('chinese-poker-current', null);

  const currentGame = games.find(g => g.id === currentGameId) ?? null;

  function handleStart(players: Player[], endCondition: EndCondition) {
    const game: Game = {
      id: crypto.randomUUID(),
      players,
      rounds: [],
      createdAt: Date.now(),
      endCondition,
    };
    setGames(prev => [...prev, game]);
    setCurrentGameId(game.id);
  }

  function handleRoundSubmit(scores: PlayerRoundScore[]) {
    setGames(prev => prev.map(g => {
      if (g.id !== currentGameId) return g;
      return {
        ...g,
        rounds: [...g.rounds, { id: crypto.randomUUID(), number: g.rounds.length + 1, scores }],
      };
    }));
  }

  if (!currentGame) {
    return (
      <Setup
        games={games}
        onStart={handleStart}
        onResume={setCurrentGameId}
        onDelete={id => setGames(prev => prev.filter(g => g.id !== id))}
      />
    );
  }

  return (
    <Scoreboard
      game={currentGame}
      onRoundSubmit={handleRoundSubmit}
      onNewGame={() => setCurrentGameId(null)}
    />
  );
}
