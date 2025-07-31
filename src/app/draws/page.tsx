
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
import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDraws } from "../admin/draws/actions";

export default async function DrawsPage() {
  const allDraws = await getDraws();
  const ongoingDraws = allDraws.filter(d => d.endDate > new Date());

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Available Draws
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Here are the active draws. Pick one and get your ticket!
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ongoingDraws.map((draw) => {
           const timeRemaining = draw.endDate.getTime() - new Date().getTime();
           const daysRemaining = Math.ceil(timeRemaining / (1000 * 3600 * 24));
          return(
          <Card key={draw.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            {draw.imageUrl && (
                <div className="relative h-48 w-full">
                    <Image src={draw.imageUrl} alt={draw.name} layout="fill" objectFit="cover" data-ai-hint="lottery ticket" />
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
                <span className="text-sm font-semibold text-muted-foreground">Ends In</span>
                <Badge variant="secondary">{daysRemaining} days</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                <Link href={`/draws/${draw.id}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Participate for ₹{draw.ticketPrice}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )})}
      </div>
    </div>
  );
}
