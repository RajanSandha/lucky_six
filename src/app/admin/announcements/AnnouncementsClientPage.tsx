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
import { Trophy, Search } from "lucide-react";
import withAdminAuth from "@/components/withAdminAuth";
import type { Draw } from "@/lib/types";

function AnnouncementsClientPage({ draws }: { draws: Draw[] }) {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Announcements Hub
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Select a draw to begin the winner announcement ceremony.
        </p>
      </div>
      {draws.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {draws.map((draw) => (
            <Card key={draw.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="relative h-48 w-full mb-4">
                  <Image src={draw.imageUrl || 'https://placehold.co/600x400.png'} alt={draw.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="lottery prize" />
                </div>
                <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                <CardDescription>Ended on {new Date(draw.endDate).toLocaleDateString()}</CardDescription>
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
                    Announce Winner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Search className="h-12 w-12 text-primary"/>
            </div>
            <h2 className="text-2xl font-semibold font-headline">No Draws Awaiting Announcement</h2>
            <p className="text-muted-foreground mt-2">
                All completed draws have had their winners announced.
            </p>
        </div>
      )}
    </div>
  );
}

export default withAdminAuth(AnnouncementsClientPage);
