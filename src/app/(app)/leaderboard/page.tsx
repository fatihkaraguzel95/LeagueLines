"use client";

import type { FC } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ListOrdered, Medal, CalendarDays, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DEMO_LEAGUE_ID,
  DEMO_LEAGUE_NAME,
  DEMO_LEAGUE_WEEKS,
  MIN_WEEKLY_SCORE_DEMO,
  MAX_WEEKLY_SCORE_DEMO,
  RANDOM_TEAMS,
  DEMO_LEAGUE_PARTICIPANTS_COUNT,
} from "@/lib/constants";
import { auth } from "@/lib/firebase"; // Auth is still used
import type { User } from "firebase/auth";
// No Firestore imports needed for this mock version

interface ParticipantScore {
  email: string; // Still useful as an ID
  username: string;
  weeklyPoints: number; // Latest week's points
  totalPoints: number;
  individualWeeklyScores: number[]; // For demo league detailed view
  avatarUrl: string;
  joinedDate: string; // Simulated
  favoriteTeam: string; // Simulated
}

interface DisplayableLeagueLeaderboardEntry {
  id: string; // League ID (e.g., 'demo-mid-season-showdown' or a generated one)
  name: string; // League Name
  participants: ParticipantScore[];
  weeksToShow: number; // How many weeks of scores to display in table
  isDemo: boolean;
}

const generateRandomDate = () => {
  const start = new Date(2023, 0, 1); // Start date for "joined"
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

const LeaderboardPage: FC = () => {
  const [displayedLeagueData, setDisplayedLeagueData] =
    useState<DisplayableLeagueLeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantScore | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastWeekHeaderRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    const leagueIdFromStorage = localStorage.getItem("selectedLeagueId");
    setSelectedLeagueId(leagueIdFromStorage);

    return () => unsubscribe();
  }, []); // Auth listener setup

  // Load leaderboard data based on selectedLeagueId (from localStorage)
  const loadLeaderboardData = useCallback(() => {
    // if (!selectedLeagueId) {
    // Only redirect if auth state is resolved (currentUser is not undefined) and still no leagueId
    // if (currentUser !== undefined && !selectedLeagueId) {
    //    router.push('/leagues');
    // }
    // setIsLoading(false);
    // return;
    // }

    setIsLoading(true);
    setDisplayedLeagueData(null); // Clear previous data

    const leagueNameFromStorage = localStorage.getItem("selectedLeagueName") || "Selected League";
    const isDemoLeague = selectedLeagueId === DEMO_LEAGUE_ID;

    const weeksForTable = isDemoLeague ? DEMO_LEAGUE_WEEKS : 1; // Demo shows full weeks, others show 1 week
    const numParticipants = isDemoLeague ? DEMO_LEAGUE_PARTICIPANTS_COUNT : 5; // Demo has more, others have a few

    const participants: ParticipantScore[] = Array.from({ length: numParticipants })
      .map((_, index) => {
        const email = isDemoLeague
          ? `player${index + 1}@example.com`
          : `user${index + 1}@mockleague.com`;
        const username = email.split("@")[0] || `User${index + 1}`;
        let scores: number[] = [];
        let currentTotal = 0;

        // Generate scores for the number of weeks to show
        for (let i = 0; i < weeksForTable; i++) {
          const weekScore =
            Math.floor(Math.random() * (MAX_WEEKLY_SCORE_DEMO - MIN_WEEKLY_SCORE_DEMO + 1)) +
            MIN_WEEKLY_SCORE_DEMO;
          scores.push(weekScore);
          currentTotal += weekScore;
        }

        return {
          email, // Use email as a unique key for map
          username,
          weeklyPoints: scores.length > 0 ? scores[scores.length - 1] : 0, // Latest week's score
          totalPoints: currentTotal,
          individualWeeklyScores: scores, // Full score history for the table
          avatarUrl: `https://placehold.co/80x80.png?text=${username[0]?.toUpperCase() || "P"}`,
          joinedDate: generateRandomDate(),
          favoriteTeam: RANDOM_TEAMS[index % RANDOM_TEAMS.length],
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints || b.weeklyPoints - a.weeklyPoints); // Sort by total, then weekly

    setDisplayedLeagueData({
      id: selectedLeagueId,
      name: leagueNameFromStorage,
      participants,
      weeksToShow: weeksForTable,
      isDemo: isDemoLeague,
    });
    setIsLoading(false);
  }, [selectedLeagueId, router, currentUser]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]); // selectedLeagueId is a dependency of loadLeaderboardData

  // Effect to scroll to the last week for demo league
  useEffect(() => {
    if (
      !isLoading &&
      displayedLeagueData &&
      displayedLeagueData.isDemo &&
      displayedLeagueData.weeksToShow > 1 &&
      scrollContainerRef.current &&
      lastWeekHeaderRef.current
    ) {
      setTimeout(() => {
        // Timeout helps ensure rendering is complete
        lastWeekHeaderRef.current?.scrollIntoView({
          behavior: "auto", // Use 'auto' for instant scroll on load
          inline: "center", // Try to center the last week column
          block: "nearest", // Align to nearest edge of scrollport
        });
      }, 100); // Small delay
    }
  }, [isLoading, displayedLeagueData]);

  const handleViewProfile = useCallback((participant: ParticipantScore) => {
    setSelectedParticipant(participant);
    setIsProfileDialogOpen(true);
  }, []);

  if (isLoading) {
    // Simplified loading state
    return (
      <>
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={28} className="text-primary" />
          <h2 className="text-2xl font-bold font-headline">Leaderboard</h2>
        </div>
        <Card className="shadow-md bg-card">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (!displayedLeagueData) {
    // If loading is false and no data (e.g., error or no league selected)
    return (
      <>
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={28} className="text-primary" />
          <h2 className="text-2xl font-bold font-headline">Leaderboard</h2>
        </div>
        <Card className="shadow-md bg-card">
          <CardHeader>
            <CardTitle>No Leaderboard Data</CardTitle>
            <CardDescription>
              {selectedLeagueId
                ? "Could not load data for the selected league (mock)."
                : "Please select a league to view the leaderboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedLeagueId && currentUser !== undefined && (
              <Button onClick={() => router.push("/leagues")}>Select a League</Button>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  const isFullDemoView =
    displayedLeagueData.isDemo && displayedLeagueData.weeksToShow === DEMO_LEAGUE_WEEKS;

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Trophy size={28} className="text-primary" />
        <h2 className="text-2xl font-bold font-headline">Leaderboard</h2>
      </div>

      <Card className="shadow-md bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered size={24} className="text-primary" />
            {displayedLeagueData.name} {displayedLeagueData.isDemo ? "(Demo)" : "(Mock League)"}
          </CardTitle>
          <CardDescription>
            Scores for {displayedLeagueData.participants.length} participants.
            {isFullDemoView
              ? ` Showing ${DEMO_LEAGUE_WEEKS} weeks. Scores are simulated.`
              : " Current standings (simulated scores)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayedLeagueData.participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No participants found for this league to display on the leaderboard (mock).
            </p>
          ) : (
            <div className="overflow-x-auto relative" ref={scrollContainerRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%] min-w-[150px] sticky left-0 bg-card z-10">
                      Participant
                    </TableHead>
                    {/* Dynamically generate week headers */}
                    {displayedLeagueData.weeksToShow > 1 ? (
                      Array.from({ length: displayedLeagueData.weeksToShow }).map((_, i) => (
                        <TableHead
                          key={`w${i + 1}`}
                          className="text-right min-w-[50px]"
                          ref={i + 1 === displayedLeagueData.weeksToShow ? lastWeekHeaderRef : null} // Ref for scrolling
                        >
                          W{i + 1}
                        </TableHead>
                      ))
                    ) : (
                      <TableHead className="text-right min-w-[100px]">Latest Points</TableHead>
                    )}
                    <TableHead className="text-right font-semibold min-w-[80px] sticky right-0 bg-card z-10">
                      Total Points
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLeagueData.participants.map((p, index) => (
                    <TableRow key={p.email}>
                      <TableCell
                        className="font-medium truncate sticky left-0 bg-card z-10"
                        title={p.username}
                      >
                        <Button
                          variant="link"
                          className="p-0 h-auto text-left text-card-foreground hover:text-primary"
                          onClick={() => handleViewProfile(p)}
                        >
                          {p.username}
                        </Button>
                      </TableCell>
                      {/* Display scores based on weeksToShow */}
                      {displayedLeagueData.weeksToShow > 1 ? (
                        p.individualWeeklyScores.map((score, weekIdx) => (
                          <TableCell key={`p${index}-w${weekIdx}`} className="text-right">
                            {score}
                          </TableCell>
                        ))
                      ) : (
                        <TableCell className="text-right">{p.weeklyPoints}</TableCell> // Show latest points if only 1 week
                      )}
                      <TableCell className="text-right font-semibold sticky right-0 bg-card z-10">
                        {p.totalPoints}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participant Profile Dialog */}
      {selectedParticipant && (
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center gap-4 mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={selectedParticipant.avatarUrl}
                    alt={selectedParticipant.username}
                    data-ai-hint="person avatar"
                  />
                  <AvatarFallback>{selectedParticipant.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl font-bold">
                  {selectedParticipant.username}
                </DialogTitle>
                <DialogDescription>{selectedParticipant.email}</DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-3 my-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Medal size={18} className="text-primary" />
                  <span>Total Points</span>
                </div>
                <span className="font-semibold text-primary">
                  {selectedParticipant.totalPoints}
                </span>
              </div>
              {/* Show latest weekly score based on whether it's full demo view or single week view */}
              {displayedLeagueData?.isDemo &&
                displayedLeagueData?.weeksToShow === DEMO_LEAGUE_WEEKS &&
                selectedParticipant.individualWeeklyScores.length === DEMO_LEAGUE_WEEKS && (
                  <div className="p-3 bg-secondary/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">
                      Latest Weekly Score (W{DEMO_LEAGUE_WEEKS}):
                    </p>
                    <p className="font-semibold text-lg text-center text-primary">
                      {selectedParticipant.individualWeeklyScores[DEMO_LEAGUE_WEEKS - 1]} points
                    </p>
                  </div>
                )}
              {(!displayedLeagueData?.isDemo || displayedLeagueData?.weeksToShow === 1) && ( // For non-demo or single-week view
                <div className="p-3 bg-secondary/50 rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">Latest Weekly Score:</p>
                  <p className="font-semibold text-lg text-center text-primary">
                    {selectedParticipant.weeklyPoints} points
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays size={18} className="text-primary" />
                  <span>Joined</span>
                </div>
                <span className="font-semibold">{selectedParticipant.joinedDate}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield size={18} className="text-primary" />
                  <span>Favorite Team (Simulated)</span>
                </div>
                <span className="font-semibold">{selectedParticipant.favoriteTeam}</span>
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LeaderboardPage;
