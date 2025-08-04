
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Search, Clock, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDraws } from "../admin/draws/actions";
import { Countdown } from "@/components/Countdown";
import type { Draw } from "@/lib/types";

const getDrawStatusInfo = (draw: Draw): { isUpcoming: boolean; isActive: boolean; countdownTo: 'start' | 'end'; countdownDate: Date } => {
    const now = new Date();
    const startDate = new Date(draw.startDate);
    const endDate = new Date(draw.endDate);
    
    if (now.getTime() < startDate.getTime()) {
        return { isUpcoming: true, isActive: false, countdownTo: 'start', countdownDate: startDate };
    }
    
    return { isUpcoming: false, isActive: true, countdownTo: 'end', countdownDate: endDate };
};


export default async function DrawsPage() {
  const allDraws = await getDraws();
  const now = new Date();
  
  // A draw is visible if its end date is in the future
  const visibleDraws = allDraws.filter(d => new Date(d.endDate) > now);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Available Draws
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here are the upcoming and active draws. Pick one and get your ticket!
        </p>
      </div>
      {visibleDraws.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleDraws.map((draw) => {
            const statusInfo = getDrawStatusInfo(draw);
            const timeRemaining = new Date(statusInfo.countdownDate).getTime() - now.getTime();
            
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

            let timeLeftBadge;
            if (days > 0) {
              timeLeftBadge = `${days}d ${hours}h`;
            } else if (hours > 0) {
              timeLeftBadge = `${hours}h ${minutes}m`;
            } else {
              timeLeftBadge = `${minutes}m`;
            }


            return (
              <Card key={draw.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                {draw.imageUrl && (
                  <div className="relative h-48 w-full">
                    <Image src={draw.imageUrl} alt={draw.name} layout="fill" objectFit="cover" data-ai-hint="lottery ticket" />
                     {draw.referralAvailable && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                            <Gift className="mr-1 h-3 w-3" />
                            Referral
                        </Badge>
                    )}
                    {statusInfo.isUpcoming && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm bg-background/80 text-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          Upcoming
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                  <CardDescription>{draw.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold text-muted-foreground">Prize Pool</span>
                    <span className="text-2xl font-bold text-primary font-headline">
                      ₹{draw.prize.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">{statusInfo.isUpcoming ? 'Starts In' : 'Ends In'}</span>
                    <Badge variant="secondary">{timeLeftBadge}</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold" disabled={statusInfo.isUpcoming}>
                    <Link href={`/draws/${draw.id}`}>
                      <Ticket className="mr-2 h-4 w-4" />
                      {statusInfo.isUpcoming ? 'View Details' : `Participate for ₹${draw.ticketPrice}`}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Search className="h-12 w-12 text-primary"/>
            </div>
            <h2 className="text-2xl font-semibold font-headline">No Draws Available Right Now</h2>
            <p className="text-muted-foreground mt-2">
                Please check back later. The next draw will be announced soon!
            </p>
        </div>
      )}
    </div>
  );
}
