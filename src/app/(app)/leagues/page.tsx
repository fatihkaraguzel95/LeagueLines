"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Send, ListChecks, PlusCircle, LogIn, Trophy, GanttChartSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendInvitationEmail } from "./actions"; // Mock action
import { auth } from "@/lib/firebase"; // Auth is still used
import type { User } from "firebase/auth";
import { DEMO_LEAGUE_ID, DEMO_LEAGUE_NAME } from "@/lib/constants";

interface League {
  id: string;
  name: string;
  invitedEmails: string[];
  creatorUid?: string;
  isDemo?: boolean;
}

const LeaguesPage: FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [leagueName, setLeagueName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");

  const [leagues, setLeagues] = useState<League[]>([]);
  const [isCreatingLeague, setIsCreatingLeague] = useState(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [addMemberInputs, setAddMemberInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const loadMockLeagues = () => {
      setIsLoadingLeagues(true);
      // Initialize with just the demo league
      const demoLeague: League = {
        id: DEMO_LEAGUE_ID,
        name: DEMO_LEAGUE_NAME,
        invitedEmails: ["demo-user1@example.com", "demo-user2@example.com"],
        creatorUid: "system",
        isDemo: true,
      };

      // Load user-created leagues from localStorage (mock persistence)
      const storedLeagues = localStorage.getItem("mock_leagues");
      const userLeagues = storedLeagues ? JSON.parse(storedLeagues) : [];

      setLeagues([demoLeague, ...userLeagues]);

      const initialMemberInputs: Record<string, string> = {};
      [demoLeague, ...userLeagues].forEach((league) => {
        initialMemberInputs[league.id] = "";
      });
      setAddMemberInputs(initialMemberInputs);

      setIsLoadingLeagues(false);
    };

    loadMockLeagues();

    return () => unsubscribe();
  }, []);

  const handleSelectLeague = useCallback(
    (league: League) => {
      localStorage.setItem("selectedLeagueId", league.id);
      localStorage.setItem("selectedLeagueName", league.name);
      toast({
        title: `League Selected: ${league.name}`,
        description: "Navigating to dashboard...",
      });
      router.push("/dashboard");
    },
    [router, toast]
  );

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast({ title: "Error", description: "League name is required.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a league.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingLeague(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async operation

    const newLeague: League = {
      id: `league-${Date.now()}`,
      name: leagueName,
      invitedEmails: [],
      creatorUid: currentUser.uid,
      isDemo: false,
    };

    setLeagues((prevLeagues) => {
      const updatedLeagues = [...prevLeagues, newLeague];
      // Persist to localStorage for mock behavior
      const userCreatedLeagues = updatedLeagues.filter((l) => !l.isDemo);
      localStorage.setItem("mock_leagues", JSON.stringify(userCreatedLeagues));
      return updatedLeagues;
    });

    setAddMemberInputs((prev) => ({ ...prev, [newLeague.id]: "" }));
    setLeagueName(""); // Clear input after creation
    setIsCreatingLeague(false);
    toast({
      title: "League Created!",
      description: `"${leagueName}" has been successfully created (mock).`,
      variant: "default",
    });
  };

  const handleAddMember = async (leagueId: string) => {
    const emailToAdd = addMemberInputs[leagueId]?.trim();
    if (!emailToAdd) {
      toast({ title: "Error", description: "Email cannot be empty.", variant: "destructive" });
      return;
    }

    const league = leagues.find((l) => l.id === leagueId);
    if (!league) {
      toast({ title: "Error", description: "League not found.", variant: "destructive" });
      return;
    }

    // Simulate sending invitation
    const result = await sendInvitationEmail(emailToAdd, league.name);

    if (result.success) {
      setLeagues((prevLeagues) =>
        prevLeagues.map((l) => {
          if (l.id === leagueId) {
            return { ...l, invitedEmails: [...l.invitedEmails, emailToAdd] };
          }
          return l;
        })
      );
      setAddMemberInputs((prev) => ({ ...prev, [leagueId]: "" })); // Clear input
      toast({ title: "Invitation Sent (Simulated)", description: result.message });
    } else {
      toast({
        title: "Failed to Send Invite",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  if (isLoadingLeagues && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>Loading leagues...</p>
      </div>
    );
  }

  const noUserLeagues =
    currentUser && !isLoadingLeagues && leagues.filter((l) => !l.isDemo).length === 0;

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={32} className="text-primary" />
          <h2 className="text-3xl font-bold font-headline">Leagues Hub</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          {noUserLeagues
            ? "You haven't created any leagues yet. Create one below or join the demo!"
            : "Select a league to view the dashboard and leaderboard, or create a new one."}
        </p>
      </div>

      {/* Available Leagues Section */}
      {leagues.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GanttChartSquare size={24} className="text-primary" />
            <h3 className="text-xl font-bold font-headline">Available Leagues</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <Card key={league.id} className="shadow-md flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    <span className="truncate">{league.name}</span>
                    {league.isDemo && (
                      <span className="text-xs bg-accent text-accent-foreground font-semibold px-2 py-1 rounded-full">
                        Demo
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground pt-1">
                    <Users size={14} />
                    <span>{league.invitedEmails.length} members</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {league.invitedEmails.length > 0 ? (
                    <ul className="space-y-1 max-h-24 overflow-y-auto bg-secondary/20 p-2 rounded-md">
                      {league.invitedEmails.map((email, index) => (
                        <li
                          key={index}
                          className="text-xs p-1 bg-secondary/50 rounded-md truncate"
                          title={email}
                        >
                          {email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No members invited yet.</p>
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start space-y-3 pt-4 border-t">
                  {!league.isDemo && (
                    <div className="w-full space-y-2">
                      <Label htmlFor={`invite-${league.id}`} className="text-xs">
                        Invite Member (Email)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`invite-${league.id}`}
                          type="email"
                          placeholder="new.member@example.com"
                          value={addMemberInputs[league.id] || ""}
                          onChange={(e) =>
                            setAddMemberInputs((prev) => ({ ...prev, [league.id]: e.target.value }))
                          }
                        />
                        <Button
                          onClick={() => handleAddMember(league.id)}
                          variant="secondary"
                          size="icon"
                        >
                          <Send size={16} />
                          <span className="sr-only">Send Invite</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => handleSelectLeague(league)}
                    className="w-full mt-2 bg-primary hover:bg-primary/90"
                  >
                    <LogIn size={18} className="mr-2" />
                    Open League
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create New League Section - Always visible for logged in users */}
      {currentUser && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <PlusCircle size={24} className="text-primary" />
            <h3 className="text-xl font-bold font-headline">Create a New League</h3>
          </div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>New League Details</CardTitle>
              <CardDescription>Give your new league a name to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="league-name">League Name</Label>
                <Input
                  id="league-name"
                  placeholder="e.g., The Office Champions"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  disabled={isCreatingLeague}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateLeague} disabled={isCreatingLeague}>
                {isCreatingLeague ? "Creating..." : "Create League"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LeaguesPage;
