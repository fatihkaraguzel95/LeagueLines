
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Gift } from 'lucide-react';

interface PromotionalPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionalPopup: FC<PromotionalPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Gift size={48} className="text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-center">
            🏆 Join Our Prediction Cup! 🏆
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground mt-2">
            Welcome to LeagueLines! Make your predictions and get a chance to win a special <span className="font-semibold text-accent">10 Euro virtual bonus!</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-6 flex justify-center">
          <Image
            src="https://placehold.co/300x150.png"
            alt="Promotional Cup Image"
            width={300}
            height={150}
            className="rounded-lg shadow-md"
            data-ai-hint="trophy award"
          />
        </div>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Sharpen your prediction skills, climb the leaderboard, and enjoy the thrill of the game!
        </p>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Let's Go!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
