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
import { useUser } from "@/context/UserContext";

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
  const { email: userEmailFromContext } = useUser();

  // YENİ: Ligleri gerçek veritabanı ile dolduran fonksiyon
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const fetchDataFromFirebase = async (contextEmail: string | null) => {
      try {
        type UserType = {
          username: string;
          name: string;
          email: string;
          leagues: string[];
        };
        // Tüm userlar cekiliyor
        const usersResponse = await fetch(
          "https://leaguelines-default-rtdb.europe-west1.firebasedatabase.app/users.json"
        );
        const usersData: Record<string, UserType> = await usersResponse.json();
        let foundUserId: string | null = null;
        let userLeagues: string[] = [];

        // Kullanıcının veritabanındaki userId'sini ve liglerini bul
        for (const id in usersData) {
          if (usersData[id].email === contextEmail) {
            foundUserId = id;
            userLeagues = usersData[id].leagues || [];
            break;
          }
        }
        if (!foundUserId) {
          toast({
            title: "Kullanıcı Bulunamadı",
            description: `Veritabanında ${contextEmail} e-postasına sahip kullanıcı bulunamadı.`,
            variant: "destructive",
          });
          setIsLoadingLeagues(false);
          return;
        }

        const leagueId = userLeagues[0];
        if (!leagueId) {
          toast({
            title: "Lig Bulunamadı",
            description: `${contextEmail} kullanıcısının kayıtlı olduğu bir lig yok.`,
            variant: "default",
          });
          setIsLoadingLeagues(false);
          return;
        }

        // Ligin ismini çek
        const leagueNameRes = await fetch(
          `https://leaguelines-default-rtdb.europe-west1.firebasedatabase.app/leagues/${leagueId}/name.json`
        );
        const leagueNameFetched = await leagueNameRes.json();

        // Ligdeki oyuncuların userId'leri
        const leaguePlayersResponse = await fetch(
          `https://leaguelines-default-rtdb.europe-west1.firebasedatabase.app/leagues/${leagueId}/players.json`
        );
        const leaguePlayers: string[] = await leaguePlayersResponse.json();

        // Oyuncuların user objelerinden username'lerini al
        const filteredUsers = Object.entries(usersData).filter(([key, user]) =>
          leaguePlayers.includes(key)
        );
        const usernamesArray = filteredUsers.map(([key, user]) => user.username);

        // GÜNCEL: Gerçek lig bilgisiyle leagues state'ini güncelle
        setLeagues([
          {
            id: leagueId, // RTDB key!
            name: leagueNameFetched || leagueId, // Varsa ad, yoksa id
            invitedEmails: usernamesArray,
            isDemo: false,
          },
        ]);
        setAddMemberInputs({ [leagueId]: "" });
        setIsLoadingLeagues(false);
      } catch (error) {
        toast({
          title: "Firebase Hatası",
          description: "Lig verisi alınamadı.",
          variant: "destructive",
        });
        setIsLoadingLeagues(false);
      }
    };

    if (currentUser && userEmailFromContext) {
      fetchDataFromFirebase(userEmailFromContext);
    } else {
      if (!currentUser) console.log("Firebase auth durumu bekleniyor...");
      if (!userEmailFromContext) console.log("Kullanıcı e-postası context'ten bekleniyor...");
    }
    return () => unsubscribe();
  }, [currentUser, userEmailFromContext, toast]);

  const handleSelectLeague = useCallback(
    (leagueId: string) => {
      localStorage.setItem("selectedLeagueId", leagueId);
      const selectedLeague = leagues.find((l) => l.id === leagueId);
      if (selectedLeague) {
        localStorage.setItem("selectedLeagueName", selectedLeague.name);
      }
      toast({
        title: `League Selected: ${selectedLeague?.name || "League"}`,
        description: "Navigating to dashboard...",
      });
      router.push("/dashboard");
    },
    [leagues, router, toast]
  );

  // ...Burada diğer handler fonksiyonların değişmeden kalabilir...
  // (Kısalttım, üstte gönderdiğin kodun add member, create league kısmı aynen kullanılabilir)

  // Render (GÖRÜNÜM KISMI)
  if (isLoadingLeagues && !currentUser) {
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
          {noLeaguesMessage
            ? "Kayıtlı olduğunuz bir lig bulunamadı."
            : "Bir lig seçerek dashboard ve leaderboard'u görüntüleyin."}
        </p>
      </div>
      {/* Ligler listesi */}
      {leagues.length > 0 && (
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
                    <CardTitle className="text-lg font-headline">{league.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ListChecks size={16} />
                      <span>{league.invitedEmails?.length || 0} üye</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 flex-grow">
                  {(league.invitedEmails?.length || 0) > 0 ? (
                    <>
                      <p className="text-sm font-medium mb-2 text-muted-foreground">
                        Üyeler:
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
                            ...ve {league.invitedEmails.length - 5} daha
                          </li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Henüz bu lige üye yok.
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex-col items-start space-y-3 pt-2 border-t">
                  <Button
                    onClick={() => handleSelectLeague(league.id)}
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
    </div>
  );
};

export default LeaguesPage;
