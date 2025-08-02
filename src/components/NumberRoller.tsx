
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NumberRollerProps {
  finalNumber: string;
  isRolling: boolean;
  className?: string;
}

const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const NumberRoller = ({ finalNumber, isRolling, className }: NumberRollerProps) => {
  const [displayNumber, setDisplayNumber] = useState('0');

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayNumber(numbers[Math.floor(Math.random() * numbers.length)]);
      }, 75); // Faster rolling speed

      return () => clearInterval(interval);
    } else {
      // When not rolling, snap to the final number
      setDisplayNumber(finalNumber);
    }
  }, [isRolling, finalNumber]);

  return (
    <div
      className={cn(
        "w-6 h-8 sm:w-8 sm:h-10 text-lg md:text-xl flex items-center justify-center font-bold rounded-md border-2 bg-gray-800 text-white transition-all duration-300 shadow-inner",
        isRolling && "border-primary/50 bg-primary/20 text-primary",
        !isRolling && "bg-accent text-accent-foreground border-accent-foreground",
        className
      )}
    >
      {displayNumber}
    </div>
  );
};
