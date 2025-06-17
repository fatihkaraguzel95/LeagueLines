
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MatchCard } from '@/components/bets/match-card';
import { getUpcomingMatches } from '@/lib/mock-data';
import type { Match, UserPredictions } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Goal } from 'lucide-react';
import { PromotionalPopup } from '@/components/ads/promotional-popup';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<UserPredictions>({});
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showPromo, setShowPromo] = useState<boolean>(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (!user) {
        setPredictions({}); // Clear predictions if user logs out
        setIsLocked(false);
      }
    });
    const leagueId = localStorage.getItem('selectedLeagueId');
    setSelectedLeagueId(leagueId);

    // Clear predictions & lock status when component mounts or league context might change
    setPredictions({});
    setIsLocked(false);

    return () => unsubscribe();
  }, []); // Runs once on mount to set up auth listener

  // Effect to load data when currentUser or selectedLeagueId changes
  useEffect(() => {
    setIsLoadingData(true);
    setMatches(getUpcomingMatches()); // Mock matches

    const shouldShowPromo = localStorage.getItem('showPromotionalPopup') === 'true';
    if (shouldShowPromo) {
      setShowPromo(true);
      localStorage.removeItem('showPromotionalPopup'); // Show only once
    }
    
    if (currentUser && selectedLeagueId) {
      // Load predictions and lock status from localStorage (mock persistence)
      const storedPredictions = localStorage.getItem(`mock_predictions_${currentUser.uid}_${selectedLeagueId}`);
      if (storedPredictions) setPredictions(JSON.parse(storedPredictions));
      else setPredictions({}); // Ensure predictions is an empty object if nothing stored
      const storedLockStatus = localStorage.getItem(`mock_lock_${currentUser.uid}_${selectedLeagueId}`);
      setIsLocked(storedLockStatus === 'true');
    } else {
      // Clear if no user or league selected
      setPredictions({});
      setIsLocked(false);
    }

    setIsLoadingData(false);
  }, [currentUser, selectedLeagueId]);


  const handleSavePrediction = useCallback((matchId: string, homeScoreGuess: number, awayScoreGuess: number) => {
    if (!currentUser || !selectedLeagueId) {
      toast({ title: "Error", description: "User or league not identified.", variant: "destructive" });
      return;
    }
    if (isLocked) {
      toast({ title: "Predictions Locked", description: "Predictions cannot be changed.", variant: "destructive" });
      return;
    }
    if (homeScoreGuess < 0 || awayScoreGuess < 0 || isNaN(homeScoreGuess) || isNaN(awayScoreGuess)) {
      toast({ title: "Invalid Prediction", description: "Scores must be non-negative.", variant: "destructive" });
      return;
    }

    setPredictions(prevPredictions => {
      const updatedPredictions = { ...prevPredictions, [matchId]: { homeScoreGuess, awayScoreGuess } };
      // Persist to localStorage for mock behavior
      if (currentUser && selectedLeagueId) {
        localStorage.setItem(`mock_predictions_${currentUser.uid}_${selectedLeagueId}`, JSON.stringify(updatedPredictions));
      }
      return updatedPredictions;
    });
    
    const match = matches.find(m => m.id === matchId);
    toast({
      title: "Prediction Saved!",
      description: `Your prediction for ${match?.homeTeam} vs ${match?.awayTeam} (${homeScoreGuess}-${awayScoreGuess}) saved (mock).`,
      variant: "default",
    });
  }, [currentUser, selectedLeagueId, isLocked, toast, matches]);

  const handleClosePromo = useCallback(() => {
    setShowPromo(false);
  }, []);

  const handleLockPredictionsLocal = useCallback(() => {
    if (!currentUser || !selectedLeagueId) {
        toast({ title: "Error", description: "User or league not identified.", variant: "destructive" });
        return;
    }
    setIsLocked(true);
    // Persist lock status to localStorage
    if (currentUser && selectedLeagueId) {
       localStorage.setItem(`mock_lock_${currentUser.uid}_${selectedLeagueId}`, 'true');
    }
    toast({
        title: "Predictions Locked (Mock)!",
        description: "Your predictions for this week are now locked locally.",
        variant: "default",
    });
  }, [currentUser, selectedLeagueId, toast]);


  if (isLoadingData && currentUser && selectedLeagueId) { // Only show loading if we expect data for a user/league
    return <div className="text-center py-10">Loading your predictions (mock)...</div>;
  }

  return (
    <>
      <PromotionalPopup isOpen={showPromo} onClose={handleClosePromo} />
      <div>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Goal size={28} className="text-primary" />
                <h2 className="text-2xl font-bold font-headline">Upcoming Matches</h2>
            </div>
            {!isLocked && currentUser && selectedLeagueId && ( // Show lock button only if logged in, league selected, and not locked
                 <Button onClick={handleLockPredictionsLocal} variant="destructive">
                    Lock Predictions
                </Button>
            )}
        </div>

        {isLocked && (
          <div className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-md shadow">
            <p className="font-semibold">Predictions are locked for this gameweek (mock).</p>
            <p className="text-sm">You can view your predictions on the 'My Predictions' page.</p>
          </div>
        )}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                currentPrediction={predictions[match.id]}
                onSavePrediction={handleSavePrediction}
                isLocked={isLocked}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming matches available at the moment.</p>
        )}
      </div>
    </>
  );
}

    