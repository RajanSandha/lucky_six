
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { getCurrentDateInUTC } from "@/lib/date-utils";

type CountdownProps = {
  targetDate: Date;
};

export function DrawCardCountdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = getCurrentDateInUTC();
      const difference = new Date(targetDate).getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Ended");
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  return <Badge variant="secondary">{timeLeft}</Badge>;
}
