
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, Users as LeaderboardIcon, LayoutGrid, MessageSquare } from 'lucide-react'; // Added MessageSquare
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Trophy } from 'lucide-react';

const menuItems = [
  { href: '/leagues', label: 'Leagues Hub', icon: LayoutGrid },
  { href: '/dashboard', label: 'Upcoming Matches', icon: Home },
  { href: '/results', label: 'My Predictions', icon: ListChecks },
  { href: '/leaderboard', label: 'Leaderboard', icon: LeaderboardIcon },
  { href: '/chat', label: 'League Chat', icon: MessageSquare }, // New Chat link
];

export function AppSidebarContent() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/leagues" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Trophy size={28} className="text-primary" />
          <span className="font-bold text-xl text-primary group-data-[collapsible=icon]:hidden">LeagueLines</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href === '/leagues' && pathname.startsWith('/leagues'))}
                tooltip={{ children: item.label, side: 'right', align: 'start', className: 'ml-2' }}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:sr-only">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
