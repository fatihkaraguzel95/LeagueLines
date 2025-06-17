
'use client'; 

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebarContent } from '@/components/layout/app-sidebar-content';
import { Header } from '@/components/layout/header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLeagueCheckComplete, setIsLeagueCheckComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoadingAuth) {
      setIsLeagueCheckComplete(false); // Keep loading if auth state is not yet determined
      return;
    }

    if (!currentUser) {
      router.replace('/login');
      setIsLeagueCheckComplete(false); // Keep loading until redirect to login is complete
      return;
    }

    // User is authenticated at this point
    // Pages that can manage their own "no league selected" state or don't require one
    const canBypassLeagueCheck = 
      pathname.startsWith('/leagues') || // Leagues page itself, or sub-pages like create
      pathname === '/leaderboard';     // Leaderboard page handles its own "no league" message

    if (canBypassLeagueCheck) {
      setIsLeagueCheckComplete(true);
    } else {
      // For all other authenticated pages, a league must be selected
      const selectedLeagueId = localStorage.getItem('selectedLeagueId');
      if (!selectedLeagueId) {
        router.replace('/leagues'); // Redirect to select a league
        setIsLeagueCheckComplete(false); // Show loading until redirect completes
      } else {
        setIsLeagueCheckComplete(true); // League is selected, proceed
      }
    }
  }, [currentUser, isLoadingAuth, router, pathname]);

  if (isLoadingAuth || !isLeagueCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>Loading application state...</p> 
      </div>
    );
  }

  const isChatPage = pathname === '/chat';
  const isLeaguesPage = pathname.startsWith('/leagues');

  // Special layout for the leagues page (simple header, no main app sidebar)
  if (isLeaguesPage) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header isSimple={true} /> 
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="text-center py-4 text-muted-foreground text-sm border-t bg-background">
          <p>&copy; {new Date().getFullYear()} LeagueLines. Predict scores and compete!</p>
        </footer>
      </div>
    );
  }

  // Default layout for other app pages (with sidebar)
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarContent />
      <SidebarInset className="flex flex-col min-h-screen">
        <Header /> 
        <div
          className={cn(
            "flex-grow", 
            isChatPage 
              ? "flex flex-col overflow-hidden" // Specific styling for chat page to take full height
              : "container mx-auto px-4 py-8" // Standard padding for other pages
          )}
        >
          {children}
        </div>
        {!isChatPage && ( // Footer for non-chat pages
          <footer className="text-center py-4 text-muted-foreground text-sm border-t bg-background">
            <p>&copy; {new Date().getFullYear()} LeagueLines. Predict scores and compete!</p>
          </footer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
