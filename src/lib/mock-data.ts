
import type { Match } from './types';

const placeholderLogo = (seed: string) => `https://placehold.co/40x40.png?text=${seed[0]}`;

// Add some placeholder actual scores for demonstration
const upcomingMatches: Match[] = [
  {
    id: '1',
    homeTeam: 'Fenerbahçe',
    awayTeam: 'Galatasaray',
    matchDate: 'Saturday, August 10',
    kickOffTime: '21:00',
    homeTeamLogo: placeholderLogo('Fenerbahçe'),
    awayTeamLogo: placeholderLogo('Galatasaray'),
    homeScoreActual: 2, // Example actual score
    awayScoreActual: 1, // Example actual score
  },
  {
    id: '2',
    homeTeam: 'Beşiktaş',
    awayTeam: 'Trabzonspor',
    matchDate: 'Sunday, August 11',
    kickOffTime: '19:00',
    homeTeamLogo: placeholderLogo('Beşiktaş'),
    awayTeamLogo: placeholderLogo('Trabzonspor'),
    homeScoreActual: 0, // Example actual score
    awayScoreActual: 0, // Example actual score
  },
  {
    id: '3',
    homeTeam: 'Başakşehir FK',
    awayTeam: 'Konyaspor',
    matchDate: 'Sunday, August 11',
    kickOffTime: '21:00',
    homeTeamLogo: placeholderLogo('Başakşehir'),
    awayTeamLogo: placeholderLogo('Konyaspor'),
    // No actual scores yet for this match
  },
  {
    id: '4',
    homeTeam: 'Sivasspor',
    awayTeam: 'Antalyaspor',
    matchDate: 'Monday, August 12',
    kickOffTime: '19:00',
    homeTeamLogo: placeholderLogo('Sivasspor'),
    awayTeamLogo: placeholderLogo('Antalyaspor'),
    // No actual scores yet for this match
  },
];

export const getUpcomingMatches = (): Match[] => {
  return upcomingMatches;
};
