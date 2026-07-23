import { useState } from 'react';
import type { Player, PlayerRoundScore } from '../types';
import { calculateRoundScores } from '../scoring';
import styles from './RoundEntry.module.css';

interface Props {
  players: Player[];
  roundNumber: number;
  onSubmit: (scores: PlayerRoundScore[]) => void;
}

interface PlayerEntry {
  front: number;
  middle: number;
  back: number;
  royalties: number;
  fouled: boolean;
}

const RANK_LABELS = ['1st', '2nd', '3rd', '4th'];

export function RoundEntry({ players, roundNumber, onSubmit }: Props) {
  const n = players.length;
  const [entries, setEntries] = useState<PlayerEntry[]>(
    players.map(() => ({ front: 1, middle: 1, back: 1, royalties: 0, fouled: false }))
  );

  function toggleFoul(playerIdx: number) {
    setEntries(prev => {
      const next = [...prev];
      const wasFouled = next[playerIdx].fouled;
      next[playerIdx] = {
        ...next[playerIdx],
        fouled: !wasFouled,
        front: wasFouled ? 1 : n,
        middle: wasFouled ? 1 : n,
        back: wasFouled ? 1 : n,
      };
      return next;
    });
  }

  function setRank(playerIdx: number, hand: 'front' | 'middle' | 'back', rank: number) {
    setEntries(prev => {
      const next = [...prev];
      next[playerIdx] = { ...next[playerIdx], [hand]: rank, fouled: false };
      return next;
    });
  }

  function adjustRoyalties(playerIdx: number, delta: number) {
    setEntries(prev => {
      const next = [...prev];
      next[playerIdx] = { ...next[playerIdx], royalties: Math.max(0, next[playerIdx].royalties + delta) };
      return next;
    });
  }

  function submit() {
    const entriesMap: Record<string, { front: number; middle: number; back: number; royalties: number }> = {};
    players.forEach((p, i) => {
      entriesMap[p.id] = {
        front: n + 1 - entries[i].front,
        middle: n + 1 - entries[i].middle,
        back: n + 1 - entries[i].back,
        royalties: entries[i].royalties,
      };
    });
    onSubmit(calculateRoundScores(players, entriesMap));
  }

  const cols = `minmax(4rem, 1fr) minmax(4rem, auto) repeat(3, minmax(5rem, 2fr)) minmax(7rem, 1.2fr)`;

  return (
    <div className={styles.wrap}>
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: cols }}>
          <div className={styles.cell}>Player</div>
          <div className={styles.cell}>Foul</div>
          <div className={styles.cell}>Front</div>
          <div className={styles.cell}>Middle</div>
          <div className={styles.cell}>Back</div>
          <div className={styles.cell}>Royalties</div>
        </div>

        {players.map((player, i) => (
          <div
            key={player.id}
            className={`${styles.tableRow} ${entries[i].fouled ? styles.fouledRow : ''}`}
            style={{ gridTemplateColumns: cols }}
          >
            <div className={`${styles.cell} ${styles.playerName}`}>{player.name}</div>

            <div className={`${styles.cell} ${styles.foulCell}`}>
              <button
                className={`${styles.foulBtn} ${entries[i].fouled ? styles.foulBtnActive : ''}`}
                onClick={() => toggleFoul(i)}
                title="Foul"
              >
                F
              </button>
            </div>

            {(['front', 'middle', 'back'] as const).map(hand => (
              <div key={hand} className={styles.cell}>
                <div className={styles.rankBtns}>
                  {Array.from({ length: n }, (_, k) => k + 1).map(rank => (
                    <button
                      key={rank}
                      className={`${styles.rankBtn} ${entries[i][hand] === rank ? (entries[i].fouled ? styles.rankBtnFouled : styles.rankBtnActive) : ''}`}
                      onClick={() => setRank(i, hand, rank)}
                    >
                      {RANK_LABELS[rank - 1]}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.cell}>
              <div className={styles.stepper}>
                <button className={styles.stepBtn} onClick={() => adjustRoyalties(i, -1)}>−</button>
                <input
                  type="number"
                  className={`${styles.stepVal} ${entries[i].royalties > 0 ? styles.stepValPos : ''}`}
                  value={entries[i].royalties === 0 ? '' : entries[i].royalties}
                  placeholder="0"
                  min={0}
                  onChange={e => setEntries(prev => {
                    const next = [...prev];
                    next[i] = { ...next[i], royalties: Math.max(0, parseInt(e.target.value) || 0) };
                    return next;
                  })}
                />
                <button className={styles.stepBtn} onClick={() => adjustRoyalties(i, 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className="btn-gold" onClick={submit}>Save Round {roundNumber}</button>
      </div>
    </div>
  );
}
