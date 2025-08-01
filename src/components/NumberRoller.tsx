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
      }, 50);

      return () => clearInterval(interval);
    } else {
      setDisplayNumber(finalNumber);
    }
  }, [isRolling, finalNumber]);

  return (
    <div
      className={cn(
        "w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-md border bg-primary/10 text-primary transition-all duration-300",
        className
      )}
    >
      {displayNumber}
    </div>
  );
};
