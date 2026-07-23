import { useState } from 'react';
import type { Player } from '../types';
import styles from './Setup.module.css';

interface Props {
  onStart: (players: Player[]) => void;
}

export function Setup({ onStart }: Props) {
  const [names, setNames] = useState(['', '', '', '']);
  const [count, setCount] = useState(2);

  const activePlayers = names.slice(0, count);
  const canStart = activePlayers.filter(n => n.trim()).length === count;

  function start() {
    const players: Player[] = activePlayers.map((name, i) => ({
      id: `p${i + 1}`,
      name: name.trim() || `Player ${i + 1}`,
    }));
    onStart(players);
  }

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

        <button className={`btn-primary ${styles.startBtn}`} onClick={start} disabled={!canStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
