
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
import { Trophy, Search, Calendar, CheckCircle } from "lucide-react";
import withAdminAuth from "@/components/withAdminAuth";
import type { Draw } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

function AnnouncementsClientPage({ draws }: { draws: Draw[] }) {
  const now = new Date();
  const upcomingDraws = draws.filter(d => d.status !== 'finished' && new Date(d.announcementDate) > now);
  const pastDraws = draws.filter(d => d.status === 'finished' || new Date(d.announcementDate) <= now);


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Announcements Hub
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Launch and review winner announcement ceremonies.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4 flex items-center">
            <Calendar className="mr-3 h-6 w-6 text-primary" />
            Upcoming Ceremonies
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
                    <CardDescription>Scheduled for {new Date(draw.announcementDate).toLocaleString()}</CardDescription>
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
                    <Link href={`/admin/draws/${draw.id}/announce`}>
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
                <p>No upcoming announcements scheduled.</p>
            </div>
        )}
      </div>

      <Separator className="my-12" />

      <div>
         <h2 className="text-2xl font-bold font-headline mb-4 flex items-center">
            <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
            Past Ceremonies
        </h2>
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
                        <Link href={`/admin/draws/${draw.id}/announce`}>
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
                <p>No past announcements found.</p>
            </div>
        )}
      </div>


    </div>
  );
}

export default withAdminAuth(AnnouncementsClientPage);
