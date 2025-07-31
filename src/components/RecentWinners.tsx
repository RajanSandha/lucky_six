import { Award, Gift, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { draws, users } from "@/lib/data";

export function RecentWinners() {
    const pastDraws = draws
        .filter(d => d.endDate <= new Date() && d.winnerId)
        .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
        .slice(0, 3);
    
    if (pastDraws.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold">Recent Winners</h2>
                    <p className="text-muted-foreground mt-2">Proof that winning happens!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {pastDraws.map(draw => {
                        const winner = users.find(u => u.id === draw.winnerId);
                        return (
                            <Card key={draw.id} className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className="p-3 bg-accent/20 rounded-full">
                                        <Award className="h-8 w-8 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-headline">{winner?.name}</CardTitle>
                                        <CardDescription>Won on {draw.endDate.toLocaleDateString()}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-sm text-muted-foreground">Won</p>
                                    <p className="text-2xl font-bold font-headline text-primary">₹{draw.prize.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-muted-foreground mt-1">in the "{draw.name}"</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}