
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase'; // Auth is still used
import type { User } from 'firebase/auth';
import { DEMO_LEAGUE_ID, DEMO_LEAGUE_NAME } from '@/lib/constants'; // For demo context

interface ChatMessage {
  id: string; 
  senderName: string;
  senderInitials: string;
  text: string;
  timestamp: Date; 
  isOwnMessage: boolean;
}

// Initial mock messages for any chat room
const mockInitialMessages: ChatMessage[] = [
  { id: '1', senderName: 'Alice', senderInitials: 'A', text: 'Hi everyone! Ready for this week\'s matches?', timestamp: new Date(Date.now() - 1000 * 60 * 5), isOwnMessage: false },
  { id: '2', senderName: 'Bob', senderInitials: 'B', text: 'Definitely! My predictions are locked in.', timestamp: new Date(Date.now() - 1000 * 60 * 3), isOwnMessage: false },
  { id: '3', senderName: 'Charlie', senderInitials: 'C', text: 'Good luck all! 🤞', timestamp: new Date(Date.now() - 1000 * 60 * 1), isOwnMessage: false },
];

const ChatPage: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockInitialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null); // For context, not for data fetching
  const [userInitial, setUserInitial] = useState('U');
  const [leagueName, setLeagueName] = useState('General Discussion'); // Mock league name

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && user.email) {
        const username = user.email.split('@')[0] || 'User';
        setUserInitial(username[0]?.toUpperCase() || 'U');
      } else {
        setUserInitial('U');
      }
    });

    // Attempt to get league context from localStorage
    const leagueId = localStorage.getItem('selectedLeagueId');
    setSelectedLeagueId(leagueId); // Keep track of selected league for context
    const storedLeagueName = localStorage.getItem('selectedLeagueName');
    if (storedLeagueName) {
        setLeagueName(storedLeagueName + " Chat");
    } else {
        // Fallback if no name stored, possibly default to demo or generic
        setLeagueName(leagueId === DEMO_LEAGUE_ID ? DEMO_LEAGUE_NAME + " Chat" : "League Chat");
    }
    
    // Reset messages to initial mock messages if league changes or on first load
    setMessages(mockInitialMessages);


    return () => unsubscribeAuth();
  }, []); // Runs once on mount

  // This effect listens to selectedLeagueId to reset chat for a new "league context"
  useEffect(() => {
    setMessages(mockInitialMessages); // Reset to demo messages for any league
    const storedLeagueName = localStorage.getItem('selectedLeagueName');
     if (storedLeagueName) {
        setLeagueName(storedLeagueName + " Chat");
    } else {
        setLeagueName(selectedLeagueId === DEMO_LEAGUE_ID ? DEMO_LEAGUE_NAME + " Chat" : "League Chat");
    }
  }, [selectedLeagueId]);


  useEffect(() => {
    // Scroll to bottom when messages change
    const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !currentUser) return; // Basic validation
    
    const senderName = currentUser.email?.split('@')[0] || currentUser.displayName || 'You';

    const messageData: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`, // More unique ID for local messages
      senderName: senderName,
      senderInitials: userInitial,
      text: newMessage,
      timestamp: new Date(),
      isOwnMessage: true,
    };

    setMessages(prevMessages => [...prevMessages, messageData]);
    setNewMessage('');
  };
  
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6"> {/* Added padding here */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={28} className="text-primary" />
        <h2 className="text-2xl font-bold font-headline">{leagueName}</h2>
      </div>
      <Card className="shadow-md flex-grow flex flex-col overflow-hidden"> {/* Added overflow-hidden */}
        <CardHeader className="border-b">
          <CardTitle>Discussion</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden"> {/* flex-grow and overflow-hidden are key */}
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!msg.isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${msg.senderInitials}`} alt={msg.senderName} data-ai-hint="person avatar"/>
                      <AvatarFallback>{msg.senderInitials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg shadow ${
                      msg.isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    }`}
                  >
                    {!msg.isOwnMessage && <p className="text-xs font-semibold mb-0.5">{msg.senderName}</p>}
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.isOwnMessage ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left' }`}>
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                  {msg.isOwnMessage && (
                     <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${userInitial}`} alt="You" data-ai-hint="person avatar"/>
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow"
              disabled={!currentUser} // Only disable if no user, league context not strictly needed for mock chat
            />
            <Button onClick={handleSendMessage} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!currentUser || newMessage.trim() === ''}>
              <Send size={18} className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatPage;

    