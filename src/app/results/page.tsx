

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


async function getUserById(id: string): Promise<UserType | null> {
    if (!id) return null;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserType;
    }
    return null;
}

// This is a placeholder for getting ticket by id.
async function getTicketById(id: string): Promise<TicketType | null> {
    if (!id) return null;
    const ticketSnap = await getDoc(doc(db, "tickets", id));
    if (ticketSnap.exists()) {
        const data = ticketSnap.data();
        return {
            id: ticketSnap.id,
            ...data,
             purchaseDate: data.purchaseDate.toDate(),
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
          const winningTicket = draw.winningTicketId ? await getTicketById(draw.winningTicketId) : null;
          const winner = winningTicket ? await getUserById(winningTicket.userId) : null;
          return {...draw, winningTicket, winner}
      })
  );


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Past Draw Results
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Check out the winners from our previous draws.
        </p>
      </div>
      <div className="space-y-8">
        {drawsWithWinnerInfo.map((draw) => {
          const winnerName = draw.winner?.name || "Anonymous";
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
                            {/* <AvatarImage src={draw.winner?.imageUrl} alt={winnerName} /> */}
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
                    <p className="text-lg font-bold font-mono tracking-widest text-primary">{draw.winningTicket?.numbers || "N/A"}</p>
                  </div>
                   <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg justify-center">
                    <WinnerAddressModal winner={draw.winner} />
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

    