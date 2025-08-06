

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Ticket } from "lucide-react";
import { WinnerAddressModal } from "@/components/WinnerAddressModal";
import { getDraws } from "../admin/draws/actions";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as UserType, Ticket as TicketType } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

export const dynamic = 'force-dynamic';

async function getUserById(id: string): Promise<UserType | null> {
    if (!id) return null;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        return { 
            id: userSnap.id, 
            ...data,
            // Ensure any Timestamps are converted
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined
        } as UserType;
    }
    return null;
}

async function getTicketById(id: string): Promise<TicketType | null> {
    if (!id) return null;
    const ticketSnap = await getDoc(doc(db, "tickets", id));
    if (ticketSnap.exists()) {
        const data = ticketSnap.data();
        return {
            id: ticketSnap.id,
            ...data,
             purchaseDate: data.purchaseDate?.toDate(),
        } as TicketType;
    }
    return null;
}


export default async function ResultsPage() {
  const allDraws = await getDraws();
  // A past draw is one that is finished
  const pastDraws = allDraws.filter(d => d.status === 'finished' && d.winningTicketId);

  // We need to fetch winner and ticket for each draw
  const drawsWithWinnerInfo = await Promise.all(
      pastDraws.map(async (draw) => {
          const winningTicketData = draw.winningTicketId ? await getTicketById(draw.winningTicketId) : null;
          const winnerData = winningTicketData ? await getUserById(winningTicketData.userId) : null;
          
          // Ensure all parts of the objects are serializable
          const serializableDraw = {
            ...draw,
            startDate: draw.startDate,
            endDate: draw.endDate,
            announcementDate: draw.announcementDate,
            createdAt: draw.createdAt instanceof Date ? draw.createdAt : (draw.createdAt as any)?.toDate(),
          };

          const serializableTicket = winningTicketData ? {
              ...winningTicketData,
              purchaseDate: winningTicketData.purchaseDate
          } : null;

          return {draw: serializableDraw, winningTicket: serializableTicket, winner: winnerData}
      })
  );


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Award className="h-10 w-10" />
          Past Draw Results
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Check out the winners from our previous draws.
        </p>
      </div>
      <div className="space-y-8">
        {drawsWithWinnerInfo.map(({draw, winningTicket, winner}) => {
          const winnerName = winner?.name || "Anonymous";
          const winnerInitials = winnerName.split(' ').map(n => n[0]).join('');

          return (
            <Card key={draw.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                        <CardDescription>
                            Draw ended on {new Date(draw.endDate).toLocaleString()}
                        </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                        Prize: ₹{draw.prize.toLocaleString('en-IN')}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Award className="h-8 w-8 text-accent-foreground mb-2" />
                    <h3 className="font-semibold text-muted-foreground">Winner</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Avatar>
                            {/* In a real app, you might have user.imageUrl */}
                            {/* <AvatarImage src={winner?.imageUrl} alt={winnerName} /> */}
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                {winnerInitials}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-lg font-bold font-headline text-primary">{winnerName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Ticket className="h-8 w-8 text-accent-foreground mb-2" />
                    <h3 className="font-semibold text-muted-foreground">Winning Ticket</h3>
                    <p className="text-lg font-bold font-mono tracking-widest text-primary">{winningTicket?.numbers || "N/A"}</p>
                  </div>
                   <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg justify-center">
                    <WinnerAddressModal winner={winner} draw={draw} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
         {pastDraws.length === 0 && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No results to show yet. Check back after a draw has ended!</p>
            </div>
         )}
      </div>
    </div>
  );
}
