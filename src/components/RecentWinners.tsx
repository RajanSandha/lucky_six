
import { Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDraws } from "@/app/admin/draws/actions";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as UserType } from "@/lib/types";

// This is a placeholder for getting user by id.
async function getUserById(id: string): Promise<UserType | null> {
    if (!id) return null;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserType;
    }
    
    return null;
}

export async function RecentWinners() {
    const allDraws = await getDraws();
    const pastDraws = allDraws
        .filter(d => d.status === 'finished' && d.winnerId)
        .sort((a, b) => new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime())
        .slice(0, 3);

    const drawsWithWinners = await Promise.all(
        pastDraws.map(async (draw) => {
            const winner = draw.winnerId ? await getUserById(draw.winnerId) : null;
            return { ...draw, winner };
        })
    );
    
    if (drawsWithWinners.length === 0) {
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
                    {drawsWithWinners.map(draw => {
                        return (
                            <Card key={draw.id} className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="flex-row items-center gap-4">
                                    <div className="p-3 bg-accent/20 rounded-full">
                                        <Award className="h-8 w-8 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-headline">{draw.winner?.name || 'Anonymous'}</CardTitle>
                                        <CardDescription>Won on {new Date(draw.endDate).toLocaleDateString()}</CardDescription>
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
