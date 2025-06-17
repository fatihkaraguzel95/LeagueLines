
'use client';
import type { FC } from 'react';
import Link from 'next/link';
import { Trophy, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface HeaderProps {
  isSimple?: boolean; 
}

export const Header: FC<HeaderProps> = ({ isSimple = false }) => {
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('selectedLeagueId'); // Clear selected league on logout
      toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
          variant: 'default',
      });
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
          title: 'Logout Failed',
          description: 'Could not log out. Please try again.',
          variant: 'destructive',
      });
    }
  };

  const homeLink = isSimple ? "/leagues" : "/dashboard";

  return (
    <header className="bg-primary text-primary-foreground py-4 shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isSimple && ( 
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                {/*
                  SidebarTrigger itself is a Button component.
                  The className here will be passed down and merged in SidebarTrigger's Button.
                  The "Open sidebar" sr-only text is also handled by SidebarTrigger.
                */}
                <SidebarTrigger className="md:hidden mr-2 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground/90" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 md:hidden bg-sidebar text-sidebar-foreground">
                 <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-sidebar-border">
                    <Link href={homeLink} className="flex items-center gap-2 hover:opacity-90 transition-opacity" onClick={() => setMobileSheetOpen(false)}>
                      <Trophy size={28} className="text-primary" />
                      <span className="font-bold text-xl text-primary">LeagueLines</span>
                    </Link>
                  </div>
                  <nav className="flex-grow p-4 space-y-2">
                      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild onClick={() => setMobileSheetOpen(false)}>
                        <Link href="/leagues">Leagues Hub</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild onClick={() => setMobileSheetOpen(false)}>
                        <Link href="/dashboard">Upcoming Matches</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild onClick={() => setMobileSheetOpen(false)}>
                        <Link href="/results">My Predictions</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild onClick={() => setMobileSheetOpen(false)}>
                        <Link href="/leaderboard">Leaderboard</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild onClick={() => setMobileSheetOpen(false)}>
                        <Link href="/chat">League Chat</Link>
                      </Button>
                  </nav>
                  <div className="p-4 mt-auto border-t border-sidebar-border">
                      <Button variant="outline" className="w-full text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => { handleLogout(); setMobileSheetOpen(false); }}>
                          <LogOut size={18} className="mr-2" />
                          Logout
                      </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link href={homeLink} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Trophy size={32} className="text-accent-foreground hidden md:flex" />
            <h1 className="text-2xl font-bold font-headline">LeagueLines</h1>
          </Link>
        </div>
        
        <div className="hidden md:flex">
            <Button variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground/90">
                <LogOut size={18} className="mr-2" />
                Logout
            </Button>
        </div>
        {isSimple && (
           <div className="md:hidden">
             <Button variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground/90" size="icon">
                <LogOut size={18} />
                <span className="sr-only">Logout</span>
            </Button>
           </div>
        )}
      </div>
    </header>
  );
};
