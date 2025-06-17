
'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUpcomingMatches } from '@/lib/mock-data';
import type { Match, UserPredictions } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { fetchMatchResults } from './actions'; // Mock action
import { auth } from '@/lib/firebase'; // Auth is still used
import type { User } from 'firebase/auth';

const ResultsPage: FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<UserPredictions>({});
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoadingScores, setIsLoadingScores] = useState<boolean>(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
       if (!user) { // Clear local data if user logs out
        setPredictions({});
        setIsLocked(false);
      }
    });
    const leagueId = localStorage.getItem('selectedLeagueId');
    setSelectedLeagueId(leagueId);

    // Clear data on initial mount or context change
    setPredictions({});
    setIsLocked(false);

    return () => unsubscribe();
  }, []); // Auth listener setup

  const handleFetchScores = useCallback(async (currentMatchData: Match[], forceBypassLockCheck = false) => {
    if (!forceBypassLockCheck && !isLocked) {
        toast({
            title: "Predictions Not Locked",
            description: "Please lock your predictions before fetching scores.",
            variant: "destructive",
        });
        return;
    }

    setIsLoadingScores(true);
    try {
      const updatedMatchesWithResults = await fetchMatchResults(currentMatchData); // Calls mock action
      setMatches(updatedMatchesWithResults);
      toast({
        title: "Scores Updated (Mock)",
        description: "Live scores have been fetched (or simulated).",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to fetch scores (mock):", error);
      toast({
        title: "Error Fetching Scores (Mock)",
        description: "Could not retrieve live scores at this time.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingScores(false);
    }
  }, [isLocked, toast]); // isLocked dependency is important here for the guard clause


  // Load mock data and localStorage persisted state
  const loadMockDataForLeague = useCallback(async () => {
    setIsLoadingData(true);
    const initialMatches = getUpcomingMatches(); // Mock matches
    setMatches(initialMatches);

    if (!currentUser || !selectedLeagueId) {
      setPredictions({});
      setIsLocked(false);
      setIsLoadingData(false);
      return;
    }
    
    // Load predictions and lock status from localStorage (mock persistence)
     if (currentUser && selectedLeagueId) {
      const dashboardPredictions = localStorage.getItem(`mock_predictions_${currentUser.uid}_${selectedLeagueId}`);
      if (dashboardPredictions) {
        setPredictions(JSON.parse(dashboardPredictions));
      } else {
        setPredictions({}); // Ensure predictions is an empty object if nothing stored
      }
      const dashboardLock = localStorage.getItem(`mock_lock_${currentUser.uid}_${selectedLeagueId}`);
      const currentIsLocked = dashboardLock === 'true';
      setIsLocked(currentIsLocked);

      // If predictions were locked on dashboard, automatically fetch "results"
      if (currentIsLocked) { 
        // Pass initialMatches directly to handleFetchScores to avoid stale closure issues
        handleFetchScores(initialMatches, true); // forceBypassLockCheck = true
      }
    }
    setIsLoadingData(false);
  }, [currentUser, selectedLeagueId, handleFetchScores]); // handleFetchScores is stable due to its own useCallback

  useEffect(() => {
     loadMockDataForLeague();
  }, [loadMockDataForLeague]); // Re-run when user, league, or the loader itself changes


  const handleLockPredictions = useCallback(() => {
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
      description: "Your predictions for this week are now locked. You can now try to fetch results.",
      variant: "default",
    });
    // Fetch scores after locking
    const currentMatchDefs = getUpcomingMatches(); // Get fresh match definitions
    setMatches(currentMatchDefs); // Update state with fresh definitions
    handleFetchScores(currentMatchDefs, true); // forceBypassLockCheck = true
  }, [currentUser, selectedLeagueId, toast, handleFetchScores]);
  
  if (isLoadingData && currentUser && selectedLeagueId) {
    return <div className="text-center py-10">Loading results (mock)...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye size={28} className="text-primary" />
          <h2 className="text-2xl font-bold font-headline">My Predictions & Results</h2>
        </div>
        {!isLocked ? (
          <Button onClick={handleLockPredictions} variant="destructive" className="bg-destructive hover:bg-destructive/90" disabled={!currentUser || !selectedLeagueId}>
            <Lock size={18} className="mr-2" />
            Lock All Predictions
          </Button>
        ) : (
          <Button onClick={() => handleFetchScores(matches)} disabled={isLoadingScores || !currentUser || !selectedLeagueId} variant="outline">
            <RefreshCw size={18} className={`mr-2 ${isLoadingScores ? 'animate-spin' : ''}`} />
            {isLoadingScores ? 'Refreshing...' : 'Refresh Scores'}
          </Button>
        )}
      </div>

      {isLocked && (
        <div className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-md shadow">
          <p className="font-semibold">Your predictions for this gameweek are locked (mock).</p>
          <p className="text-sm">Results will be updated here as matches conclude. You might need to refresh.</p>
        </div>
      )}

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => {
            const prediction = predictions[match.id];
            const hasActualResult = typeof match.homeScoreActual === 'number' && typeof match.awayScoreActual === 'number';

            return (
              <Card key={match.id} className="shadow-md flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      {match.homeTeamLogo && <Image src={match.homeTeamLogo} alt={`${match.homeTeam} logo`} width={20} height={20} data-ai-hint="football logo"/>}
                      <span className="truncate">{match.homeTeam}</span>
                    </div>
                    <span className="text-muted-foreground text-sm px-1">vs</span>
                    <div className="flex items-center gap-2 truncate">
                      {match.awayTeamLogo && <Image src={match.awayTeamLogo} alt={`${match.awayTeam} logo`} width={20} height={20} data-ai-hint="football logo"/>}
                      <span className="truncate">{match.awayTeam}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 flex-grow">
                  <p className="text-xs text-muted-foreground mb-2 text-center">{match.matchDate} - {match.kickOffTime}</p>
                  
                  <div className="text-center mb-2">
                    <p className="text-sm font-medium">Your Prediction:</p>
                    {prediction ? (
                      <p className="text-xl font-bold">
                        {prediction.homeScoreGuess} - {prediction.awayScoreGuess}
                      </p>
                    ) : (
                      <p className="text-md text-muted-foreground italic">No prediction</p>
                    )}
                  </div>

                  {isLocked && ( // Only show actual results if predictions are locked
                    <div className="text-center mt-2 pt-2 border-t border-border">
                      <p className="text-sm font-medium">Actual Result:</p>
                      {hasActualResult ? (
                        <p className="text-xl font-bold text-primary">
                          {match.homeScoreActual} - {match.awayScoreActual}
                        </p>
                      ) : (
                        <p className="text-md text-muted-foreground italic">Not yet concluded or updated</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">No upcoming matches found.</p>
      )}
    </>
  );
};

export default ResultsPage;

    