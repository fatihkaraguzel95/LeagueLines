
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // Formatted date string for display
  kickOffTime: string; // Formatted time string for display
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScoreActual?: number;
  awayScoreActual?: number;
}

export interface Prediction {
  matchId: string;
  homeScoreGuess: number;
  awayScoreGuess: number;
}

// For storing predictions in component state
export interface UserPredictionInput {
  homeScoreGuess: number;
  awayScoreGuess: number;
}

export type UserPredictions = Record<string, UserPredictionInput>;
