export interface Player {
  id: string;
  name: string;
}

export type HandResult = 'win' | 'loss' | 'tie';

export interface PlayerRoundScore {
  playerId: string;
  front: number;    // points from front hand comparisons
  middle: number;   // points from middle hand comparisons
  back: number;     // points from back hand comparisons
  scoop: number;    // scoop bonus (3 points for winning all 3)
  royalties: number;
  total: number;
}

export interface Round {
  id: string;
  number: number;
  scores: PlayerRoundScore[];
}

export type EndCondition =
  | { type: 'points';   target: number }
  | { type: 'rounds';   target: number }
  | { type: 'duration'; minutes: number }
  | { type: 'clock';    endTime: number };

export interface Game {
  id: string;
  players: Player[];
  rounds: Round[];
  createdAt: number;
  endCondition: EndCondition;
}
