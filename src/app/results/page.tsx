
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Ticket, User } from "lucide-react";
import { WinnerAddressModal } from "@/components/WinnerAddressModal";
import { getDraws } from "../admin/draws/actions";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as UserType, Ticket as TicketType } from "@/lib/types";

// This is a placeholder for getting user by id. In a real app this would be a proper query.
async function getUserById(id: string): Promise<UserType | null> {
    if (!id) return null;
    // In a real app, you would fetch user from a 'users' collection
    // For this example, we return a mock user if id is 'user-1'
    if (id === 'user-1') {
        return {
            id: 'user-1',
            name: 'Alice',
            phone: '123'
        } as UserType
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
            ...data
        } as TicketType;
    }
    return null;
}


export default async function ResultsPage() {
  const allDraws = await getDraws();
  const pastDraws = allDraws.filter(d => d.endDate <= new Date() && d.winningTicketId);

  // We need to fetch winner and ticket for each draw
  const drawsWithWinnerInfo = await Promise.all(
      pastDraws.map(async (draw) => {
          const winningTicket = draw.winningTicketId ? await getTicketById(draw.winningTicketId) : null;
          // In a real app, winnerId would be on the ticket, or queried differently.
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
          return (
            <Card key={draw.id} className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                        <CardDescription>
                            Draw ended on {draw.endDate.toLocaleDateString()}
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
                    <p className="text-lg font-bold font-headline text-primary">{draw.winner?.name || "Anonymous"}</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Ticket className="h-8 w-8 text-accent-foreground mb-2" />
                    <h3 className="font-semibold text-muted-foreground">Winning Ticket</h3>
                    <p className="text-lg font-bold font-mono tracking-widest text-primary">{draw.winningTicket?.numbers || "N/A"}</p>
                  </div>
                   <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg justify-center">
                    {/* Assuming current user is 'user-1' for demo */}
                    {draw.winner?.id === "user-1" ? (
                      <WinnerAddressModal />
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-5 w-5 mr-2"/>
                        <span>Not you</span>
                      </div>
                    )}
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
