
'use client';

import React, { useState, useEffect, type FC } from 'react';
import Image from 'next/image';
import type { Match, UserPredictionInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, Save, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MatchCardProps {
  match: Match;
  currentPrediction?: UserPredictionInput;
  onSavePrediction: (matchId: string, homeGuess: number, awayGuess: number) => void;
  isLocked?: boolean;
}

export const MatchCard: FC<MatchCardProps> = ({ match, currentPrediction, onSavePrediction, isLocked }) => {
  const [homeGuess, setHomeGuess] = useState<string>(currentPrediction?.homeScoreGuess?.toString() ?? '');
  const [awayGuess, setAwayGuess] = useState<string>(currentPrediction?.awayScoreGuess?.toString() ?? '');

  useEffect(() => {
    setHomeGuess(currentPrediction?.homeScoreGuess?.toString() ?? '');
    setAwayGuess(currentPrediction?.awayScoreGuess?.toString() ?? '');
  }, [currentPrediction]);

  const handleSave = () => {
    if (isLocked) return; // Should be handled by parent toast, but good to double check

    const homeScore = parseInt(homeGuess, 10);
    const awayScore = parseInt(awayGuess, 10);

    if (isNaN(homeScore) || homeScore < 0 || isNaN(awayScore) || awayScore < 0) {
      // Basic validation, parent component (HomePage) shows a toast
      // Consider showing a local error message or relying on parent's toast
      return;
    }
    onSavePrediction(match.id, homeScore, awayScore);
  };

  return (
    <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${isLocked ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-headline flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            {match.homeTeamLogo && <Image src={match.homeTeamLogo} alt={`${match.homeTeam} logo`} width={24} height={24} data-ai-hint="football logo" />}
            <span className="truncate">{match.homeTeam}</span>
          </div>
          <span className="text-muted-foreground text-sm px-1">vs</span>
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{match.awayTeam}</span>
            {match.awayTeamLogo && <Image src={match.awayTeamLogo} alt={`${match.awayTeam} logo`} width={24} height={24} data-ai-hint="football logo" />}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm text-muted-foreground flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <CalendarDays size={16} />
            <span>{match.matchDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{match.kickOffTime}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <Label htmlFor={`home-score-${match.id}`} className="text-xs text-muted-foreground">{match.homeTeam}</Label>
<Input
  id={`home-score-${match.id}`}
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={homeGuess}
  onKeyDown={(e) => {
    const invalidChars = ["e", "E", "+", "-", ".", ","];
    if (invalidChars.includes(e.key)) {
      e.preventDefault();
    }
  }}
  onChange={(e) => {
    const val = e.target.value;
    // Sadece rakam ve en fazla 2 karakter kontrolü
    if (/^\d{0,2}$/.test(val)) {
      setHomeGuess(val);
    }
  }}
  placeholder="0"
  className="mt-1 text-center"
  disabled={isLocked}
  aria-disabled={isLocked}
/>
          </div>
          <div>
            <Label htmlFor={`away-score-${match.id}`} className="text-xs text-muted-foreground">{match.awayTeam}</Label>
<Input
  id={`away-score-${match.id}`}
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={awayGuess}
  onKeyDown={(e) => {
    const invalidChars = ["e", "E", "+", "-", ".", ","];
    if (invalidChars.includes(e.key)) {
      e.preventDefault();
    }
  }}
  onChange={(e) => {
    const val = e.target.value;
    if (/^\d{0,2}$/.test(val)) {
      setAwayGuess(val);
    }
  }}
  placeholder="0"
  className="mt-1 text-center"
  disabled={isLocked}
  aria-disabled={isLocked}
/>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={isLocked}
          aria-disabled={isLocked}
        >
          {isLocked ? <Lock size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
          {isLocked ? 'Predictions Locked' : 'Save Prediction'}
        </Button>
      </CardFooter>
    </Card>
  );
};
