
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
        "w-12 h-16 flex items-center justify-center text-3xl font-bold rounded-md border-2 border-gray-600 bg-gray-800 text-white transition-all duration-300 shadow-inner",
        !isRolling && "bg-accent text-accent-foreground border-accent-foreground",
        className
      )}
    >
      {displayNumber}
    </div>
  );
};
