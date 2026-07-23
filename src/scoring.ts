import type { Player, PlayerRoundScore } from './types';

// For a round entry, we store per-player "wins" in each position (front/middle/back).
// When comparing, each player-vs-player matchup contributes +1 for win, -1 for loss, 0 for tie.
// Scooping (winning all 3 hands against one opponent) = 3 bonus points from that opponent.

export interface RoundEntry {
  playerId: string;
  frontWins: Record<string, 1 | -1 | 0>;   // vs each other player
  middleWins: Record<string, 1 | -1 | 0>;
  backWins: Record<string, 1 | -1 | 0>;
  royalties: number;
}

export function calculateRoundScores(
  players: Player[],
  entries: Record<string, { front: number; middle: number; back: number; royalties: number }>
): PlayerRoundScore[] {
  // entries: playerId -> hand rank scores (higher = better hand)
  // We compare each pair of players for each position

  const scores: Record<string, PlayerRoundScore> = {};

  for (const p of players) {
    scores[p.id] = {
      playerId: p.id,
      front: 0,
      middle: 0,
      back: 0,
      scoop: 0,
      royalties: entries[p.id]?.royalties ?? 0,
      total: 0,
    };
  }

  // Compare each unique pair
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      const ea = entries[a.id];
      const eb = entries[b.id];
      if (!ea || !eb) continue;

      const frontResult = compareHands(ea.front, eb.front);
      const middleResult = compareHands(ea.middle, eb.middle);
      const backResult = compareHands(ea.back, eb.back);

      scores[a.id].front += frontResult;
      scores[b.id].front -= frontResult;

      scores[a.id].middle += middleResult;
      scores[b.id].middle -= middleResult;

      scores[a.id].back += backResult;
      scores[b.id].back -= backResult;

      // Scoop check: one player wins all 3
      const totalA = frontResult + middleResult + backResult;
      if (totalA === 3) {
        // A scooped B
        scores[a.id].scoop += 3;
        scores[b.id].scoop -= 3;
      } else if (totalA === -3) {
        // B scooped A
        scores[b.id].scoop += 3;
        scores[a.id].scoop -= 3;
      }
    }
  }

  // Finalize totals
  for (const p of players) {
    const s = scores[p.id];
    s.total = s.front + s.middle + s.back + s.scoop + s.royalties;
  }

  return players.map(p => scores[p.id]);
}

function compareHands(a: number, b: number): 1 | -1 | 0 {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

/** Returns 1-based dense ranks: tied players get the same rank number. */
export function getDenseRanks(playerIds: string[], totals: Record<string, number>): Record<string, number> {
  const sorted = [...playerIds].sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));
  const ranks: Record<string, number> = {};
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (totals[sorted[i]] ?? 0) !== (totals[sorted[i - 1]] ?? 0)) {
      rank = i + 1;
    }
    ranks[sorted[i]] = rank;
  }
  return ranks;
}

export function getRunningTotals(rounds: { scores: PlayerRoundScore[] }[], playerIds: string[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const id of playerIds) totals[id] = 0;
  for (const round of rounds) {
    for (const s of round.scores) {
      totals[s.playerId] = (totals[s.playerId] ?? 0) + s.total;
    }
  }
  return totals;
}
