

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Search, Calendar, CheckCircle, Radio, ArrowRight, Megaphone } from "lucide-react";
import type { Draw } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function AnnouncementsClientPage({ draws }: { draws: Draw[] }) {
  const now = new Date();
  
  const announcingDraws = draws.filter(d => d.status === 'announcing' || (new Date(d.announcementDate) <= now && d.status !== 'finished')).slice(0, 5);
  const upcomingDraws = draws.filter(d => 
    d.status !== 'finished' && 
    new Date(d.endDate) < now && 
    new Date(d.announcementDate) > now &&
    !announcingDraws.some(ad => ad.id === d.id) // Exclude draws that are already announcing
  ).slice(0, 5);
  const pastDraws = draws.filter(d => d.status === 'finished').slice(0, 10);


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Megaphone className="h-10 w-10" />
          Draw Results
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Review results from past, present, and upcoming draws.
        </p>
      </div>

       <div>
        <h2 className="text-2xl font-bold font-headline mb-4 flex items-center">
            <Radio className="mr-3 h-6 w-6 text-purple-600 animate-pulse" />
            Announcing Now
        </h2>
        {announcingDraws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {announcingDraws.map((draw) => (
                <Card key={draw.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 border-purple-500/50">
                <CardHeader>
                    <div className="relative h-48 w-full mb-4">
                        <Image src={draw.imageUrl || 'https://placehold.co/600x400.png'} alt={draw.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="lottery prize" />
                    </div>
                    <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                    <CardDescription>Ceremony in progress...</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-muted-foreground">Prize Pool</span>
                        <span className="text-2xl font-bold text-primary font-headline">
                        ₹{draw.prize.toLocaleString('en-IN')}
                        </span>
                    </div>
                </CardContent>
                <CardContent>
                    <Button asChild className="w-full bg-purple-600 text-white hover:bg-purple-600/90">
                    <Link href={`/announcements/${draw.id}`}>
                        <Trophy className="mr-2 h-4 w-4" />
                        Watch Live
                    </Link>
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4"/>
                <p>No draws are being announced right now.</p>
            </div>
        )}
      </div>

      <Separator className="my-12" />

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4 flex items-center">
            <Calendar className="mr-3 h-6 w-6 text-primary" />
            Upcoming Results
        </h2>
        {upcomingDraws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingDraws.map((draw) => (
                <Card key={draw.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                    <div className="relative h-48 w-full mb-4">
                        <Image src={draw.imageUrl || 'https://placehold.co/600x400.png'} alt={draw.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="lottery prize" />
                    </div>
                    <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                    <CardDescription>Results scheduled for {new Date(draw.announcementDate).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-muted-foreground">Prize Pool</span>
                        <span className="text-2xl font-bold text-primary font-headline">
                        ₹{draw.prize.toLocaleString('en-IN')}
                        </span>
                    </div>
                </CardContent>
                <CardContent>
                    <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={`/announcements/${draw.id}`}>
                        <Trophy className="mr-2 h-4 w-4" />
                        View Ceremony
                    </Link>
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
            <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4"/>
                <p>No upcoming results scheduled.</p>
            </div>
        )}
      </div>

      <Separator className="my-12" />

      <div>
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold font-headline flex items-center">
                <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
                Past Results
            </h2>
         </div>
         {pastDraws.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastDraws.map((draw) => (
                <Card key={draw.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 bg-muted/30">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                    <CardDescription>Concluded on {new Date(draw.announcementDate).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-muted-foreground">Prize Pool</span>
                        <span className="text-xl font-bold text-primary/80 font-headline">
                        ₹{draw.prize.toLocaleString('en-IN')}
                        </span>
                    </div>
                </CardContent>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/announcements/${draw.id}`}>
                           View Results
                        </Link>
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4"/>
                <p>No past results found.</p>
            </div>
        )}
      </div>


    </div>
  );
}
