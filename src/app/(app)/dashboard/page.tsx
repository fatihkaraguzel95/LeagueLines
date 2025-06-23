'use client';

import { useState, useEffect } from 'react';
import { MatchCard } from '@/components/bets/match-card';
import { ref, get, set } from 'firebase/database';
import { database, auth } from '@/lib/firebase';
import { Goal } from 'lucide-react';
import type { UserPredictionInput } from "@/lib/types"; // tipini burada da import et

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  kickOffTime: string;
  results?: Record<string, { homeScore: number; awayScore: number }>;
  userPrediction?: UserPredictionInput; // yeni ekledik!
};

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    const leagueId = localStorage.getItem('selectedLeagueId') ?? 'superlig2025';
    setSelectedLeagueId(leagueId);

    if (!leagueId) {
      setIsLoadingData(false);
      setMatches([]);
      return () => unsub();
    }

    setIsLoadingData(true);

    const fetchMatches = async () => {
      try {
        const snapshot = await get(ref(database, `leagues/${leagueId}/matches`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const matchArray: Match[] = Object.entries(data).map(([key, value]: [string, any]) => {
            let matchDate = '';
            let kickOffTime = '';
            if (value.date) {
              const d = new Date(value.date);
              matchDate = d.toLocaleDateString();
              kickOffTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            // KULLANICININ TAHMİNİ VARSA AL
            let userPrediction: UserPredictionInput | undefined = undefined;
            if (
              value.results &&
              currentUser &&
              value.results[currentUser.uid]
            ) {
              userPrediction = {
                homeScoreGuess: value.results[currentUser.uid].homeScore,
                awayScoreGuess: value.results[currentUser.uid].awayScore,
              };
            }

            return {
              id: key,
              homeTeam: value.teams[0] || "",
              awayTeam: value.teams[1] || "",
              matchDate,
              kickOffTime,
              results: value.results ?? {},
              userPrediction,
            };
          });
          setMatches(matchArray);
        } else {
          setMatches([]);
        }
      } catch (error) {
        setMatches([]);
      }
      setIsLoadingData(false);
    };

    // currentUser geldikten sonra fetch et
    if (currentUser) {
      fetchMatches();
    }

    return () => unsub();
  }, [currentUser]);

  // (Diğer kodlar aynı kalıyor...)

  const handleSavePrediction = async (
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    debugger;
    if (!selectedLeagueId || !currentUser) {
      alert("Lütfen giriş yapın ve bir lig seçin.");
      return;
    }
    try {
      debugger;
      const userId = currentUser.uid;
      const predictionRef = ref(
        database,
        `leagues/${selectedLeagueId}/matches/${matchId}/results/${userId}`
      );
      await set(predictionRef, {
        homeScore,
        awayScore,
      });
      alert("Tahminin kaydedildi!");

      // Kaydettikten sonra ilgili maçı güncelle:
      setMatches(prev =>
        prev.map(m =>
          m.id === matchId
            ? {
                ...m,
                userPrediction: {
                  homeScoreGuess: homeScore,
                  awayScoreGuess: awayScore,
                },
              }
            : m
        )
      );
    } catch (e) {
      alert("Tahmin kaydedilemedi. Hata: " + (e as Error).message);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-10">Loading matches...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Goal size={28} className="text-primary" />
          <h2 className="text-2xl font-bold font-headline">Upcoming Matches</h2>
        </div>
      </div>
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              currentPrediction={match.userPrediction}
              onSavePrediction={handleSavePrediction}
              // isLocked gibi diğer prop'lar da eklenebilir
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No upcoming matches available at the moment.</p>
      )}
    </div>
  );
}
