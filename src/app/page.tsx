
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
import { Ticket, Star, Users, ArrowRight, Gift, Clock } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import { RecentWinners } from "@/components/RecentWinners";
import { getDraws } from "./admin/draws/actions";
import type { Draw } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const getHomepageDraw = (allDraws: Draw[]): Draw | null => {
    const now = new Date();
    // Prioritize active draws
    const activeDraws = allDraws
        .filter(d => new Date(d.startDate) <= now && new Date(d.endDate) > now)
        .sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    
    if(activeDraws.length > 0) return activeDraws[0];

    // If no active draws, find the next upcoming draw
    const upcomingDraws = allDraws
        .filter(d => new Date(d.startDate) > now)
        .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    if(upcomingDraws.length > 0) return upcomingDraws[0];

    return null; // No active or upcoming draws
}

const getDrawStatusInfo = (draw: Draw): { text: string; countdownDate: Date | null, isActionable: boolean, countdownTo: 'start' | 'end' | null } => {
    const now = new Date();
    const startDate = new Date(draw.startDate);
    const endDate = new Date(draw.endDate);

    if (draw.status === 'finished' || now > new Date(draw.announcementDate)) {
        return { text: "Completed", countdownDate: null, isActionable: false, countdownTo: null };
    }
    if (draw.status === 'announcing') {
        return { text: "Announcing", countdownDate: null, isActionable: true, countdownTo: null };
    }
    if (now < startDate) {
        return { text: "Upcoming", countdownDate: startDate, isActionable: false, countdownTo: 'start' };
    }
    if (now >= startDate && now <= endDate) {
        return { text: "Active", countdownDate: endDate, isActionable: true, countdownTo: 'end' };
    }
    return { text: "Awaiting Announcement", countdownDate: new Date(draw.announcementDate), isActionable: false, countdownTo: null };
};


export default async function Home() {
  const allDraws = await getDraws();
  const mainDraw = getHomepageDraw(allDraws);
  const statusInfo = mainDraw ? getDrawStatusInfo(mainDraw) : null;

  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-primary/10 py-20 md:py-32">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tighter mb-4">
            Welcome to Lucky Six
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-body">
            Your chance to win amazing prizes is just a six-digit number away.
            Participate in our draws, and you could be the next big winner!
          </p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/draws" className="font-bold">
              View Draws <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">How to Play</h2>
            <p className="text-muted-foreground mt-2">It's simple to get started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-semibold mb-2">1. Register</h3>
              <p className="text-muted-foreground font-body">
                Create an account with your name and mobile number. It's quick and secure.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <Ticket className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-semibold mb-2">2. Get a Ticket</h3>
              <p className="text-muted-foreground font-body">
                Pick your own six-digit number or let our system generate one for you.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/20 rounded-full mb-4">
                <Star className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-headline font-semibold mb-2">3. Win</h3>
              <p className="text-muted-foreground font-body">
                Wait for the draw day. If your ticket matches, you win the grand prize!
              </p>
            </div>
          </div>
        </div>
      </section>

      {mainDraw && statusInfo && (
        <section className="w-full bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4 flex justify-center">
            <Card className="w-full max-w-2xl shadow-lg overflow-hidden">
               {mainDraw.imageUrl && (
                <div className="relative h-64 w-full">
                    <Image src={mainDraw.imageUrl} alt={mainDraw.name} layout="fill" objectFit="cover" data-ai-hint="lottery prize" />
                    {mainDraw.referralAvailable && (
                        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                            <Gift className="mr-1 h-3 w-3" />
                            Referral
                        </Badge>
                    )}
                    {statusInfo.text === 'Upcoming' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary" className="text-sm bg-background/80 text-foreground">
                                <Clock className="mr-2 h-4 w-4" />
                                {statusInfo.text}
                            </Badge>
                        </div>
                    )}
                </div>
            )}
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">{mainDraw.name}</CardTitle>
                <CardDescription>{mainDraw.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="text-5xl font-bold font-headline tracking-tight text-primary">₹{mainDraw.prize.toLocaleString('en-IN')}</p>
                   {statusInfo.countdownDate && (
                       <>
                        <p className="text-lg text-muted-foreground mt-4">{statusInfo.countdownTo === 'start' ? 'Draw starts in:' : 'Draw ends in:'}</p>
                        <Countdown endDate={statusInfo.countdownDate} />
                       </>
                   )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto font-bold" disabled={!statusInfo.isActionable}>
                  <Link href={`/draws/${mainDraw.id}`}>
                    <Ticket className="mr-2 h-5 w-5" />
                    {statusInfo.text === 'Upcoming' ? 'View Details' : 'Buy a Ticket Now'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      )}

      <RecentWinners />
    </div>
  );
}
