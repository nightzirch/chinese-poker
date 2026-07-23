import { useState, useEffect } from 'react';
import type { Game, PlayerRoundScore, EndCondition } from '../types';
import { getRunningTotals, getDenseRanks } from '../scoring';
import styles from './Scoreboard.module.css';
import { RoundEntry } from './RoundEntry';
import { ScoreChart } from './ScoreChart';

interface Props {
  game: Game;
  onRoundSubmit: (scores: PlayerRoundScore[]) => void;
  onNewGame: () => void;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const ROYALTY_TABLE = [
  { hand: 'Straight', front: 2, middle: 4, back: null },
  { hand: 'Flush', front: 4, middle: 8, back: null },
  { hand: 'Full House', front: 6, middle: 12, back: null },
  { hand: 'Four of a Kind', front: 10, middle: 20, back: null },
  { hand: 'Straight Flush', front: 15, middle: 30, back: null },
  { hand: 'Royal Flush', front: 25, middle: 50, back: null },
  { hand: 'Pair of 6s', front: null, middle: null, back: 1 },
  { hand: 'Pair of 7s', front: null, middle: null, back: 2 },
  { hand: 'Pair of 8s', front: null, middle: null, back: 3 },
  { hand: 'Pair of 9s', front: null, middle: null, back: 4 },
  { hand: 'Pair of 10s', front: null, middle: null, back: 5 },
  { hand: 'Pair of Jacks', front: null, middle: null, back: 6 },
  { hand: 'Pair of Queens', front: null, middle: null, back: 7 },
  { hand: 'Pair of Kings', front: null, middle: null, back: 8 },
  { hand: 'Pair of Aces', front: null, middle: null, back: 9 },
  { hand: 'Three of a Kind', front: null, middle: 2, back: null },
  { hand: 'Triple 3s', front: null, middle: null, back: 11 },
  { hand: 'Triple 2s', front: null, middle: null, back: 10 },
  { hand: 'Triple 4s', front: null, middle: null, back: 12 },
  { hand: 'Triple 5s', front: null, middle: null, back: 13 },
  { hand: 'Triple 6s', front: null, middle: null, back: 14 },
  { hand: 'Triple 7s', front: null, middle: null, back: 15 },
  { hand: 'Triple 8s', front: null, middle: null, back: 16 },
  { hand: 'Triple 9s', front: null, middle: null, back: 17 },
  { hand: 'Triple 10s', front: null, middle: null, back: 18 },
  { hand: 'Triple Jacks', front: null, middle: null, back: 19 },
  { hand: 'Triple Queens', front: null, middle: null, back: 20 },
  { hand: 'Triple Kings', front: null, middle: null, back: 21 },
  { hand: 'Triple Aces', front: null, middle: null, back: 22 },
];

function fmt(n: number) {
  return (n > 0 ? '+' : '') + n;
}

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin}m left`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h left` : `${h}h ${m}m left`;
}

function checkGameOver(ec: EndCondition, totals: Record<string, number>, roundCount: number, now: number, createdAt: number): boolean {
  switch (ec.type) {
    case 'points':   return Object.values(totals).some(t => t >= ec.target);
    case 'rounds':   return roundCount >= ec.target;
    case 'duration': return now >= createdAt + ec.minutes * 60000;
    case 'clock':    return now >= ec.endTime;
  }
}

function endConditionLabel(ec: EndCondition, totals: Record<string, number>, roundCount: number, now: number, createdAt: number): string {
  switch (ec.type) {
    case 'points': {
      const best = Math.max(0, ...Object.values(totals));
      return `First to ${ec.target} pts · Leading: ${fmt(best)}`;
    }
    case 'rounds':
      return `Round ${roundCount} of ${ec.target}`;
    case 'duration': {
      const endTs = createdAt + ec.minutes * 60000;
      const rem = formatRemaining(endTs - now);
      return rem ? `Ends at ${formatClock(endTs)} · ${rem}` : `Ends at ${formatClock(endTs)}`;
    }
    case 'clock': {
      const rem = formatRemaining(ec.endTime - now);
      return rem ? `Ends at ${formatClock(ec.endTime)} · ${rem}` : `Ends at ${formatClock(ec.endTime)}`;
    }
  }
}

// Fallback for games saved before this feature was added
const DEFAULT_END: EndCondition = { type: 'points', target: 100 };

export function Scoreboard({ game, onRoundSubmit, onNewGame }: Props) {
  const [now, setNow] = useState(Date.now());
  const { players, rounds } = game;
  const ec = game.endCondition ?? DEFAULT_END;

  useEffect(() => {
    if (ec.type !== 'duration' && ec.type !== 'clock') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ec.type]);
  const playerIds = players.map(p => p.id);
  const totals = getRunningTotals(rounds, playerIds);
  const denseRanks = getDenseRanks(playerIds, totals);
  const gameOver = rounds.length > 0 && checkGameOver(ec, totals, rounds.length, now, game.createdAt);

  const ranked = [...players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  const winner = ranked.find(p => denseRanks[p.id] === 1);

  const showPodium = ranked.length >= 3;
  const podiumOrder = showPodium ? [ranked[1], ranked[0], ranked[2]] : [];
  const restPlayers = showPodium ? ranked.slice(3) : [];

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.logo}>🀄</span>
            <div>
              <h1 className={styles.title}>Chinese Poker Scoring</h1>
              <span className={styles.roundCount}>{rounds.length} round{rounds.length !== 1 ? 's' : ''} played · {endConditionLabel(ec, totals, rounds.length, now, game.createdAt)}</span>
            </div>
          </div>
          <button className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={onNewGame}>
            Back
          </button>
        </div>

        {gameOver && (
          <div className={styles.gameOverBanner}>
            <span className={styles.gameOverTitle}>Game over</span>
            {winner && (
              <span className={styles.gameOverWinner}>🏆 {winner.name} wins!</span>
            )}
          </div>
        )}

        {showPodium ? (
          <div className={styles.podiumWrap}>
            {podiumOrder.map((player, slot) => {
              const denseRank = denseRanks[player.id]; // 1-based: 1, 2, or 3
              const total = totals[player.id] ?? 0;
              const isTop = denseRank === 1;
              return (
                <div key={player.id} className={`${styles.podiumSpot} ${isTop ? styles.podiumSpotTop : ''}`}>
                  <div className={styles.podiumInfo}>
                    <span className={styles.podiumMedal}>{MEDALS[denseRank] ?? ''}</span>
                    <span className={styles.podiumName}>{player.name}</span>
                    <span className={`${styles.podiumScore} ${total > 0 ? styles.positive : total < 0 ? styles.negative : ''}`}>
                      {fmt(total)}
                    </span>
                  </div>
                  <div className={`${styles.podiumBlock} ${styles[`podiumBlock${denseRank}`]}`}>
                    {denseRank}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.standings}>
            {ranked.map((player) => {
              const total = totals[player.id] ?? 0;
              const denseRank = denseRanks[player.id];
              const isLeader = denseRank === 1 && rounds.length > 0;
              return (
                <div key={player.id} className={`${styles.standingRow} ${isLeader ? styles.leader : ''}`}>
                  <span className={styles.rank}>{isLeader ? '👑' : `#${denseRank}`}</span>
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={`${styles.totalScore} ${total > 0 ? styles.positive : total < 0 ? styles.negative : ''}`}>
                    {fmt(total)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {restPlayers.length > 0 && (
          <div className={styles.standings}>
            {restPlayers.map((player) => {
              const total = totals[player.id] ?? 0;
              const denseRank = denseRanks[player.id];
              return (
                <div key={player.id} className={styles.standingRow}>
                  <span className={styles.rank}>#{denseRank}</span>
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={`${styles.totalScore} ${total > 0 ? styles.positive : total < 0 ? styles.negative : ''}`}>
                    {fmt(total)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Round {rounds.length + 1}</h2>
          <RoundEntry
            key={rounds.length}
            players={players}
            roundNumber={rounds.length + 1}
            onSubmit={onRoundSubmit}
          />
        </div>

        {/* Round history */}
        {rounds.length > 0 && (
          <div className={styles.history}>
            <h2 className={styles.sectionTitle}>Round History</h2>
            <div className={styles.historyTable}>
              <div
                className={styles.historyHeader}
                style={{ gridTemplateColumns: `3rem repeat(${players.length}, 1fr)` }}
              >
                <div className={styles.roundLabel}>#</div>
                {players.map(p => (
                  <div key={p.id} className={styles.historyCell}>{p.name}</div>
                ))}
              </div>
              {[...rounds].reverse().map(round => (
                <div
                  key={round.id}
                  className={styles.historyRow}
                  style={{ gridTemplateColumns: `3rem repeat(${players.length}, 1fr)` }}
                >
                  <div className={styles.roundLabel}>{round.number}</div>
                  {players.map(p => {
                    const score = round.scores.find(s => s.playerId === p.id);
                    const val = score?.total ?? 0;
                    return (
                      <div key={p.id} className={`${styles.historyCell} ${val > 0 ? styles.pos : val < 0 ? styles.neg : ''}`}>
                        {fmt(val)}
                        {score && (score.scoop !== 0 || score.royalties !== 0) && (
                          <div className={styles.breakdown}>
                            {score.scoop !== 0 && <span className="chip chip-gold">{fmt(score.scoop)} scoop</span>}
                            {score.royalties !== 0 && <span className="chip chip-green">{fmt(score.royalties)} royal</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div
                className={`${styles.historyRow} ${styles.totalRow}`}
                style={{ gridTemplateColumns: `3rem repeat(${players.length}, 1fr)` }}
              >
                <div className={styles.roundLabel}>Total</div>
                {players.map(p => {
                  const val = totals[p.id] ?? 0;
                  return (
                    <div key={p.id} className={`${styles.historyCell} ${val > 0 ? styles.pos : val < 0 ? styles.neg : ''}`}>
                      {fmt(val)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {rounds.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Score Timeline</h2>
            <ScoreChart players={players} rounds={rounds} />
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Royalties</h2>
          <div className={styles.historyTable}>
            <div className={styles.historyHeader} style={{ gridTemplateColumns: '1fr repeat(3, 5rem)' }}>
              <div className={styles.roundLabel}>Hand</div>
              <div className={styles.historyCell}>Front</div>
              <div className={styles.historyCell}>Middle</div>
              <div className={styles.historyCell}>Back</div>
            </div>
            {ROYALTY_TABLE.map(row => (
              <div key={row.hand} className={styles.historyRow} style={{ gridTemplateColumns: '1fr repeat(3, 5rem)' }}>
                <div className={styles.roundLabel}>{row.hand}</div>
                {(['front', 'middle', 'back'] as const).map(pos => (
                  <div key={pos} className={`${styles.historyCell} ${row[pos] != null && row[pos]! > 0 ? styles.pos : ''}`}>
                    {row[pos] == null ? <span className={styles.royaltyNA}>—</span> : row[pos]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>

    </>
  );
}
