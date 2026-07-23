import { useState } from 'react';
import type { Player, EndCondition, Game } from '../types';
import { getRunningTotals, getDenseRanks } from '../scoring';
import styles from './Setup.module.css';

interface Props {
  games: Game[];
  onStart: (players: Player[], endCondition: EndCondition) => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}

type EndType = EndCondition['type'];

function defaultClockTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildEndCondition(type: EndType, value: string): EndCondition {
  switch (type) {
    case 'points':   return { type, target: Math.max(1, parseInt(value) || 100) };
    case 'rounds':   return { type, target: Math.max(1, parseInt(value) || 10) };
    case 'duration': return { type, minutes: Math.max(1, Math.round(parseFloat(value) * 60) || 60) };
    case 'clock': {
      const [h, m] = value.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      return { type, endTime: d.getTime() };
    }
  }
}

const END_TYPES: { type: EndType; label: string }[] = [
  { type: 'points',   label: 'Points'   },
  { type: 'rounds',   label: 'Rounds'   },
  { type: 'duration', label: 'Duration' },
  { type: 'clock',    label: 'Set time' },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number) {
  return (n > 0 ? '+' : '') + n;
}

export function Setup({ games, onStart, onResume, onDelete }: Props) {
  const [names, setNames] = useState(['', '', '', '']);
  const [count, setCount] = useState(2);
  const [endType, setEndType] = useState<EndType>('points');
  const [endValue, setEndValue] = useState('100');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleEndTypeChange(type: EndType) {
    setEndType(type);
    setEndValue(type === 'points' ? '100' : type === 'rounds' ? '10' : type === 'duration' ? '1' : defaultClockTime());
  }

  const activePlayers = names.slice(0, count);
  const canStart = activePlayers.filter(n => n.trim()).length === count;

  function start() {
    const players: Player[] = activePlayers.map((name, i) => ({
      id: `p${i + 1}`,
      name: name.trim() || `Player ${i + 1}`,
    }));
    onStart(players, buildEndCondition(endType, endValue));
  }

  const sortedGames = [...games].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🀄</div>
          <h1 className={styles.title}>Chinese Poker Scoring</h1>
          <p className={styles.subtitle}>Scorekeeper</p>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Number of players</label>
          <div className={styles.countRow}>
            {[2, 3, 4].map(n => (
              <button
                key={n}
                className={`${styles.countBtn} ${count === n ? styles.countBtnActive : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Player names</label>
          <div className={styles.inputs}>
            {Array.from({ length: count }).map((_, i) => (
              <input
                key={i}
                placeholder={`Player ${i + 1}`}
                value={names[i]}
                onChange={e => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                onKeyDown={e => { if (e.key === 'Enter' && canStart) start(); }}
                autoFocus={i === 0}
              />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>End condition</label>
          <div className={styles.countRow}>
            {END_TYPES.map(({ type, label }) => (
              <button
                key={type}
                className={`${styles.countBtn} ${endType === type ? styles.countBtnActive : ''}`}
                onClick={() => handleEndTypeChange(type)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.endValueRow}>
            {endType === 'points' && (
              <>
                <input type="number" className={styles.endInput} value={endValue} min={1} onChange={e => setEndValue(e.target.value)} />
                <span className={styles.endUnit}>points</span>
              </>
            )}
            {endType === 'rounds' && (
              <>
                <input type="number" className={styles.endInput} value={endValue} min={1} onChange={e => setEndValue(e.target.value)} />
                <span className={styles.endUnit}>rounds</span>
              </>
            )}
            {endType === 'duration' && (
              <>
                <input type="number" className={styles.endInput} value={endValue} min={0.5} step={0.5} onChange={e => setEndValue(e.target.value)} />
                <span className={styles.endUnit}>hours</span>
              </>
            )}
            {endType === 'clock' && (
              <>
                <span className={styles.endUnit}>At</span>
                <input type="time" className={styles.endInput} value={endValue} onChange={e => setEndValue(e.target.value)} />
              </>
            )}
          </div>
        </div>

        <button className={`btn-primary ${styles.startBtn}`} onClick={start} disabled={!canStart}>
          Start Game
        </button>
      </div>

      {sortedGames.length > 0 && (
        <div className={styles.prevCard}>
          <div className={styles.prevHeader}>Previous games</div>
          {sortedGames.map(game => {
            const playerIds = game.players.map(p => p.id);
            const totals = getRunningTotals(game.rounds, playerIds);
            const denseRanks = getDenseRanks(playerIds, totals);
            const leader = game.players
              .filter(p => denseRanks[p.id] === 1)
              .map(p => `${p.name} ${fmt(totals[p.id] ?? 0)}`)
              .join(', ');
            return (
              <div key={game.id} className={styles.gameRow} onClick={() => onResume(game.id)}>
                <div className={styles.gameMain}>
                  <span className={styles.gamePlayers}>{game.players.map(p => p.name).join(' · ')}</span>
                  <span className={styles.gameMeta}>{game.rounds.length} round{game.rounds.length !== 1 ? 's' : ''} · {timeAgo(game.createdAt)}</span>
                </div>
                {game.rounds.length > 0 && <span className={styles.gameScore}>{leader}</span>}
                <button
                  className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); setConfirmDeleteId(game.id); }}
                  title="Delete game"
                >✕</button>
              </div>
            );
          })}
        </div>
      )}

      {confirmDeleteId && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3 className={styles.confirmTitle}>Delete game?</h3>
            <p className={styles.confirmBody}>This will permanently remove the game from history.</p>
            <div className={styles.confirmActions}>
              <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
