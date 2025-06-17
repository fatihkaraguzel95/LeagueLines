"use client";

import type { FC } from "react";
import { useState, type FormEvent, useEffect, useCallback } from "react";
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
import { DEMO_LEAGUE_ID, DEMO_LEAGUE_NAME, DEMO_LEAGUE_PARTICIPANTS_COUNT } from "@/lib/constants";
import { auth } from "@/lib/firebase"; // Auth is still used
import type { User } from "firebase/auth";

interface League {
  id: string;
  name: string;
  invitedEmails: string[];
  creatorUid?: string; // Keep for potential future use if re-integrating DB
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
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true); // For initial setup
  const [addMemberInputs, setAddMemberInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    const fetchEmailFromFirebase = async () => {
      try {
        const response = await fetch(
          "https://leaguelines-default-rtdb.europe-west1.firebasedatabase.app/Emails/ad.json"
        );
        const email = await response.json();
        const emailsArray = Array.isArray(email)
          ? email // zaten array ise olduğu gibi al
          : [email];
        debugger;
        if (emailsArray) {
          setInviteEmails(email); // Mevcut inputa maili set eder
          loadLeagues(emailsArray);
        }
      } catch (error) {
        console.error("Firebase'den email alınırken hata:", error);
        toast({
          title: "Firebase Hatası",
          description: "Email verisi alınamadı.",
          variant: "destructive",
        });
      }
    };

    fetchEmailFromFirebase();

    return () => unsubscribe();
  }, []);

  // Load initial mock/demo league and locally stored leagues
  const loadLeagues = useCallback((emails: string[]) => {
    setIsLoadingLeagues(true);

    debugger;
    const demoLeague: League = {
      id: DEMO_LEAGUE_ID,
      name: DEMO_LEAGUE_NAME,
      invitedEmails: emails,
      isDemo: true,
    };
    // For this revert, we'll just start with the demo league.
    // User-created leagues will be added to `leagues` state but not persisted beyond session unless localStorage is used.
    setLeagues([demoLeague]);
    setAddMemberInputs({ [DEMO_LEAGUE_ID]: "" });
    setIsLoadingLeagues(false);
  }, []);

  // const loadLeagues = useCallback(async () => {
  //   setIsLoadingLeagues(true);

  //   try {
  //     // Burada kendi API endpoint'inizi kullanın
  //     const response = await fetch("/api/leagues");

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch leagues");
  //     }

  //     const leaguesData: League[] = await response.json();

  //     // Gelen ligler varsa state'e set et
  //     if (leaguesData.length > 0) {
  //       setLeagues(leaguesData);
  //       // Üyeleri ekleme inputu için örnek boş string olarak set edelim
  //       const addMemberInputsState = leaguesData.reduce((acc, league) => {
  //         acc[league.id] = "";
  //         return acc;
  //       }, {} as Record<string, string>);
  //       setAddMemberInputs(addMemberInputsState);
  //     } else {
  //       // Eğer veri boşsa, boş liste set edebiliriz
  //       setLeagues([]);
  //       setAddMemberInputs({});
  //     }
  //   } catch (error) {
  //     console.error("Error loading leagues:", error);
  //     // Hata durumunda da boş liste set edelim veya hata mesajı gösterelim
  //     setLeagues([]);
  //     setAddMemberInputs({});
  //   }

  //   setIsLoadingLeagues(false);
  // }, []);

  // useEffect(() => {
  //   loadLeagues();
  // }, [loadLeagues]);

  const handleCreateLeagueSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!currentUser) {
        toast({
          title: "Not Authenticated",
          description: "You must be logged in to create a league.",
          variant: "destructive",
        });
        return;
      }
      setIsCreatingLeague(true);

      if (leagueName.trim() === "") {
        toast({
          title: "League Name Required",
          description: "Please enter a name for your league.",
          variant: "destructive",
        });
        setIsCreatingLeague(false);
        return;
      }

      const emails = inviteEmails
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter((email) => email);

      const newLeague: League = {
        id: `league-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique local ID
        name: leagueName,
        invitedEmails: emails,
        creatorUid: currentUser.uid,
        isDemo: false,
      };

      setLeagues((prevLeagues) => [...prevLeagues, newLeague]);
      setAddMemberInputs((prev) => ({ ...prev, [newLeague.id]: "" }));

      toast({
        title: "League Created (Mock)!",
        description: `Your league "${leagueName}" has been added locally. Processing invitations...`,
      });

      if (emails.length > 0) {
        let sentCount = 0;
        for (const email of emails) {
          const result = await sendInvitationEmail(email, leagueName); // Still calls mock action
          if (result.success) sentCount++;
        }
        toast({
          title: "Invitations Processed (Mock)",
          description: `${sentCount} of ${emails.length} invitations for "${leagueName}" have been (simulated) sent.`,
        });
      } else {
        toast({
          title: "No Invitations to Send",
          description: `League "${leagueName}" created locally. No emails were provided for invitation.`,
        });
      }

      setLeagueName("");
      setInviteEmails("");
      setIsCreatingLeague(false);
    },
    [currentUser, leagueName, inviteEmails, toast]
  );

  const handleAddMembersToLeague = useCallback(
    async (leagueId: string) => {
      const leagueIndex = leagues.findIndex((l) => l.id === leagueId);
      const league = leagues[leagueIndex];

      if (!league || league.isDemo || league.creatorUid !== currentUser?.uid) {
        toast({
          title: "Action Not Allowed",
          description: "Cannot add members to this league type or you are not the creator.",
          variant: "destructive",
        });
        return;
      }

      const emailsString = addMemberInputs[leagueId];
      if (!emailsString || emailsString.trim() === "") {
        toast({
          title: "No Emails Provided",
          description: "Please enter email addresses to add.",
          variant: "destructive",
        });
        return;
      }

      const newEmails = emailsString
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter((email) => email);
      if (newEmails.length === 0) {
        toast({
          title: "No Valid Emails",
          description: "Please enter valid email addresses.",
          variant: "destructive",
        });
        return;
      }

      const uniqueNewEmailsToAdd = newEmails.filter(
        (email) => !league.invitedEmails.includes(email)
      );

      if (uniqueNewEmailsToAdd.length === 0) {
        toast({
          title: "No New Members to Add",
          description: "All provided emails are already invited.",
          variant: "default",
        });
        setAddMemberInputs((prev) => ({ ...prev, [leagueId]: "" }));
        return;
      }

      const updatedLeague = {
        ...league,
        invitedEmails: [...league.invitedEmails, ...uniqueNewEmailsToAdd],
      };
      setLeagues((prevLeagues) => {
        const newLeagues = [...prevLeagues];
        newLeagues[leagueIndex] = updatedLeague;
        return newLeagues;
      });

      toast({
        title: "Members Added (Mock)!",
        description: `${uniqueNewEmailsToAdd.length} new member(s) added locally to "${league.name}". Processing invitations...`,
      });

      let sentCount = 0;
      for (const email of uniqueNewEmailsToAdd) {
        const result = await sendInvitationEmail(email, league.name);
        if (result.success) sentCount++;
      }
      toast({
        title: "New Member Invitations Processed (Mock)",
        description: `${sentCount} of ${uniqueNewEmailsToAdd.length} invitations for "${league.name}" have been (simulated) sent.`,
      });

      setAddMemberInputs((prev) => ({ ...prev, [leagueId]: "" }));
    },
    [leagues, addMemberInputs, toast, currentUser]
  );

  const handleAddMemberInputChange = useCallback((leagueId: string, value: string) => {
    setAddMemberInputs((prev) => ({ ...prev, [leagueId]: value }));
  }, []);

  const handleSelectLeague = useCallback(
    (leagueId: string) => {
      localStorage.setItem("selectedLeagueId", leagueId);
      const selectedLeague = leagues.find((l) => l.id === leagueId);
      if (selectedLeague) {
        localStorage.setItem("selectedLeagueName", selectedLeague.name); // Save name for other pages
      }
      toast({
        title: `League Selected: ${selectedLeague?.name || "League"}`,
        description: "Navigating to dashboard...",
      });
      router.push("/dashboard");
    },
    [leagues, router, toast]
  );

  if (isLoadingLeagues && !currentUser) {
    // Show loading if currentUser is null as well, as auth state might still be resolving
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>Loading leagues...</p>
      </div>
    );
  }

  const noLeaguesMessage =
    currentUser && !isLoadingLeagues && leagues.filter((l) => !l.isDemo).length === 0;

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={32} className="text-primary" />
          <h2 className="text-3xl font-bold font-headline">Leagues Hub</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          {noLeaguesMessage && leagues.some((l) => l.isDemo)
            ? "Select the demo league or create your first league below to get started."
            : leagues.length === 0 && currentUser
            ? "Create your first league below to get started."
            : "Select a league to view its dashboard and leaderboard, or create a new one."}
        </p>
      </div>

      {!currentUser && leagues.length === 0 && isLoadingLeagues ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p>Loading...</p>
        </div>
      ) : !currentUser && leagues.length === 0 ? ( // Case for non-logged-in user and no demo league (should not happen with current loadLeagues)
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Welcome to LeagueLines</CardTitle>
            <CardDescription>Please log in to create or view leagues.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      ) : leagues.length === 0 && currentUser ? ( // Logged-in user, but no leagues found
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>No Leagues Yet</CardTitle>
            <CardDescription>
              You haven't created any leagues. Start by creating one below!
            </CardDescription>
          </CardHeader>
        </Card>
      ) : leagues.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GanttChartSquare size={24} className="text-primary" />
            <h3 className="text-xl font-bold font-headline">Available Leagues</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <Card key={league.id} className="shadow-md flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-headline">
                      {league.name} {league.isDemo && "(Demo)"}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ListChecks size={16} />
                      <span>{league.invitedEmails?.length || 0} invited</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 flex-grow">
                  {(league.invitedEmails?.length || 0) > 0 ? (
                    <>
                      <p className="text-sm font-medium mb-2 text-muted-foreground">
                        Invited Members (Mock):
                      </p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto bg-secondary/20 p-2 rounded-md">
                        {league.invitedEmails.slice(0, 5).map((email, index) => (
                          <li
                            key={index}
                            className="text-xs p-1.5 bg-secondary/50 rounded-md truncate"
                            title={email}
                          >
                            {email}
                          </li>
                        ))}
                        {league.invitedEmails.length > 5 && (
                          <li className="text-xs text-center p-1.5 text-muted-foreground">
                            ...and {league.invitedEmails.length - 5} more
                          </li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No members invited to this league yet.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start space-y-3 pt-2 border-t">
                  {!league.isDemo && currentUser && league.creatorUid === currentUser.uid && (
                    <>
                      <Label
                        htmlFor={`add-members-${league.id}`}
                        className="text-sm font-medium text-muted-foreground"
                      >
                        Add More Members (Mock):
                      </Label>
                      <div className="flex w-full gap-2">
                        <Input
                          id={`add-members-${league.id}`}
                          type="text"
                          placeholder="new.friend@example.com"
                          value={addMemberInputs[league.id] || ""}
                          onChange={(e) => handleAddMemberInputChange(league.id, e.target.value)}
                          className="flex-grow"
                          disabled={isCreatingLeague}
                        />
                        <Button
                          onClick={() => handleAddMembersToLeague(league.id)}
                          variant="outline"
                          size="icon"
                          aria-label="Add members"
                          disabled={isCreatingLeague}
                        >
                          <PlusCircle size={18} />
                        </Button>
                      </div>
                    </>
                  )}
                  <Button
                    onClick={() => handleSelectLeague(league.id)}
                    className="w-full mt-2 bg-primary hover:bg-primary/90"
                    disabled={isCreatingLeague}
                  >
                    <LogIn size={18} className="mr-2" />
                    Open League
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {currentUser && (
        <div className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Users size={28} className="text-primary" />
            <h3 className="text-2xl font-bold font-headline">Create New League</h3>
          </div>
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Set Up Your League</CardTitle>
              <CardDescription>
                Give your league a name and invite friends to join the prediction challenge.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateLeagueSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="leagueNameField">League Name</Label>
                  <Input
                    id="leagueNameField"
                    type="text"
                    placeholder="e.g., Office Champions League"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    required
                    disabled={isCreatingLeague}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmailsField">Invite Friends (by Email - Mock)</Label>
                  <Textarea
                    id="inviteEmailsField"
                    placeholder="Enter email addresses, separated by commas, spaces, or new lines."
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    rows={3}
                    disabled={isCreatingLeague}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas, spaces, or new lines.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={isCreatingLeague || !currentUser}
                >
                  {isCreatingLeague ? (
                    "Creating & Processing..."
                  ) : (
                    <>
                      <Send size={18} className="mr-2" /> Create League & Invite
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LeaguesPage;
