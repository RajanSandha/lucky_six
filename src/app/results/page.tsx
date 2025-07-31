import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Ticket, User } from "lucide-react";
import { draws, tickets, users } from "@/lib/data";
import { WinnerAddressModal } from "@/components/WinnerAddressModal";

export default function ResultsPage() {
  const pastDraws = draws.filter(d => d.endDate <= new Date() && d.winningTicketId);

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
        {pastDraws.map((draw) => {
          const winningTicket = tickets.find(t => t.id === draw.winningTicketId);
          const winner = users.find(u => u.id === draw.winnerId);
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
                    <p className="text-lg font-bold font-headline text-primary">{winner?.name || "Anonymous"}</p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <Ticket className="h-8 w-8 text-accent-foreground mb-2" />
                    <h3 className="font-semibold text-muted-foreground">Winning Ticket</h3>
                    <p className="text-lg font-bold font-mono tracking-widest text-primary">{winningTicket?.numbers || "N/A"}</p>
                  </div>
                   <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg justify-center">
                    {/* Assuming current user is 'user-1' for demo */}
                    {winner?.id === "user-1" ? (
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
