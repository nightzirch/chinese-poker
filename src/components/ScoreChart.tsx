import type { Player, Round } from '../types';
import styles from './ScoreChart.module.css';

interface Props {
  players: Player[];
  rounds: Round[];
}

export const PLAYER_COLORS = ['#60a5fa', '#fb923c', '#c084fc', '#34d399'];

const W = 560, H = 180;
const ML = 44, MR = 16, MT = 12, MB = 32;
const IW = W - ML - MR;
const IH = H - MT - MB;

function niceTicks(min: number, max: number): number[] {
  if (min === max) return [min - 5, min, min + 5];
  const range = max - min;
  const rough = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rough) || 1)));
  const step = Math.ceil(rough / mag) * mag || 1;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(v);
  return ticks;
}

export function ScoreChart({ players, rounds }: Props) {
  if (rounds.length === 0) return null;

  const cumulative: Record<string, number[]> = {};
  for (const p of players) cumulative[p.id] = [0];
  const running: Record<string, number> = {};
  for (const round of rounds) {
    for (const s of round.scores) running[s.playerId] = (running[s.playerId] ?? 0) + s.total;
    for (const p of players) cumulative[p.id].push(running[p.id] ?? 0);
  }

  const allValues = Object.values(cumulative).flat();
  const ticks = niceTicks(Math.min(...allValues), Math.max(...allValues));
  const yMin = ticks[0], yMax = ticks[ticks.length - 1];

  const xScale = (i: number) => ML + (i / rounds.length) * IW;
  const yScale = (v: number) => MT + ((yMax - v) / (yMax - yMin || 1)) * IH;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Grid + Y labels */}
        {ticks.map(tick => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={ML} y1={y} x2={W - MR} y2={y}
                stroke={tick === 0 ? '#475569' : '#1e293b'}
                strokeWidth={tick === 0 ? 1.5 : 1}
              />
              <text x={ML - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">{tick}</text>
            </g>
          );
        })}

        {/* X labels */}
        {rounds.map((_, i) => (
          <text
            key={i}
            x={xScale(i + 1)} y={H - MB + 16}
            textAnchor="middle" fontSize={10} fill="#64748b"
          >
            R{i + 1}
          </text>
        ))}

        {/* Lines + dots */}
        {players.map((player, pi) => {
          const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
          const series = cumulative[player.id];
          const points = series.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
          return (
            <g key={player.id}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {series.map((v, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(v)} r={i === 0 ? 2.5 : 3.5} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>

      <div className={styles.legend}>
        {players.map((player, pi) => (
          <div key={player.id} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: PLAYER_COLORS[pi % PLAYER_COLORS.length] }} />
            <span className={styles.legendName}>{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
