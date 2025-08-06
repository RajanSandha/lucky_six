
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getMyWinnings } from './actions';
import { Loader2, Award, Calendar, Search, ArrowRight, PackageCheck, Package, Rocket, CheckCircle2, CircleDot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { utcToLocalString } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import type { Draw } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


const prizeStatusMap: Record<NonNullable<Draw['prizeStatus']>, { label: string; icon: React.ElementType; step: number }> = {
    pending_confirmation: { label: 'Pending Confirmation', icon: CircleDot, step: 1 },
    address_confirmed: { label: 'Address Confirmed', icon: Package, step: 2 },
    packed: { label: 'Packed', icon: PackageCheck, step: 3 },
    shipped: { label: 'Shipped', icon: Rocket, step: 4 },
    delivered: { label: 'Delivered', icon: CheckCircle2, step: 5 },
};
const totalSteps = Object.keys(prizeStatusMap).length;


export default function MyWinningsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [winnings, setWinnings] = useState<Draw[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login?redirect=/my-winnings');
        } else if (user) {
            const fetchWinnings = async () => {
                setIsLoading(true);
                const userWinnings = await getMyWinnings(user.id);
                setWinnings(userWinnings);
                setIsLoading(false);
            };
            fetchWinnings();
        }
    }, [user, authLoading, router]);
    

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
         return null; // Redirect is happening
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-4">
                    <Award className="h-10 w-10"/> My Winnings
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    A record of all your winning draws. Congratulations!
                </p>
            </div>
            
            {winnings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {winnings.map((draw) => {
                        const currentStatusKey = draw.prizeStatus || 'pending_confirmation';
                        const currentStatus = prizeStatusMap[currentStatusKey];
                        const currentStep = currentStatus.step;

                        return (
                        <Card key={draw.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline">{draw.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Concluded on {utcToLocalString(new Date(draw.announcementDate), 'PP')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="text-center bg-primary/10 rounded-lg p-4">
                                     <p className="text-sm text-primary font-semibold">Prize Pool</p>
                                     <p className="text-3xl font-bold font-headline text-primary">₹{draw.prize.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 text-center">Prize Status: <span className="font-bold text-primary">{currentStatus.label}</span></h4>
                                     <div className="flex items-center space-x-2">
                                        {Object.values(prizeStatusMap).map(({ icon: Icon, step }) => (
                                             <React.Fragment key={step}>
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                                                        step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                    )}>
                                                        <Icon className="h-5 w-5"/>
                                                    </div>
                                                </div>
                                                {step < totalSteps && (
                                                    <div className={cn(
                                                        "flex-1 h-1 transition-colors",
                                                        step < currentStep ? 'bg-primary' : 'bg-muted'
                                                    )} />
                                                )}
                                             </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                             <CardContent>
                                <Button asChild className="w-full">
                                    <Link href={`/announcements/${draw.id}`}>
                                        View Results
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Search className="h-12 w-12 text-primary"/>
                    </div>
                    <h2 className="text-2xl font-semibold font-headline">No Winnings Yet</h2>
                    <p className="mt-2">
                        Keep playing, your lucky day might be just around the corner!
                    </p>
                     <Button asChild className="mt-6">
                        <Link href="/draws">Explore Active Draws</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
