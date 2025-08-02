
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NumberRollerProps {
  finalNumber: string;
  isRolling: boolean;
  revealDelay?: number;
  onRevealComplete?: () => void;
  className?: string;
}

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const NumberRoller = ({ finalNumber, isRolling, revealDelay = 0, onRevealComplete, className }: NumberRollerProps) => {
  const [displayNumber, setDisplayNumber] = useState('0');
  const [isRevealed, setIsRevealed] = useState(false);

  // Handle the random rolling effect
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayNumber(numbers[Math.floor(Math.random() * numbers.length)]);
      }, 75);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  // Handle the reveal of the final number
  useEffect(() => {
    setIsRevealed(false); // Reset on new roll
    if (isRolling) {
      const timer = setTimeout(() => {
        setDisplayNumber(finalNumber);
        setIsRevealed(true);
        if (onRevealComplete) {
            onRevealComplete();
        }
      }, revealDelay + 500); // Add a base delay to the staggered delay

      return () => clearTimeout(timer);
    } else {
      // If not rolling, just show 0 or a reset state
      setDisplayNumber('0');
    }
  }, [isRolling, finalNumber, revealDelay, onRevealComplete]);

  return (
    <div
      className={cn(
        "w-6 h-8 sm:w-8 sm:h-10 text-lg md:text-xl flex items-center justify-center font-bold rounded-md border-2 bg-gray-800 text-white transition-all duration-300 shadow-inner",
        isRolling && !isRevealed && "border-primary/50 bg-primary/20 text-primary",
        isRevealed && "bg-accent text-accent-foreground border-accent-foreground",
        className
      )}
    >
      {displayNumber}
    </div>
  );
};
