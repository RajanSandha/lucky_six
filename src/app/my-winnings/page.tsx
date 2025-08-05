
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getMyWinnings, type WinningEntry } from './actions';
import { Loader2, Award, Ticket, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { utcToLocalString } from '@/lib/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getYearMonthOptions(winnings: WinningEntry[]) {
    const options = new Set<string>();
    winnings.forEach(w => {
        const date = new Date(w.draw.announcementDate);
        options.add(`${date.getFullYear()}-${date.getMonth()}`);
    });
    return Array.from(options).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
    });
}


export default function MyWinningsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [winnings, setWinnings] = useState<WinningEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterMonth, setFilterMonth] = useState<string>('all');

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
    
    const yearMonthOptions = useMemo(() => getYearMonthOptions(winnings), [winnings]);

    const filteredWinnings = useMemo(() => {
        return winnings.filter(w => {
            const date = new Date(w.draw.announcementDate);
            const yearMatch = filterYear === 'all' || date.getFullYear() === Number(filterYear);
            const monthMatch = filterMonth === 'all' || date.getMonth() === Number(filterMonth);
            return yearMatch && monthMatch;
        });
    }, [winnings, filterYear, filterMonth]);
    
    const groupedWinnings = useMemo(() => {
        return filteredWinnings.reduce<Record<string, WinningEntry[]>>((acc, winning) => {
            const date = new Date(winning.draw.announcementDate);
            const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(winning);
            return acc;
        }, {});
    }, [filteredWinnings]);

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
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-4">
                    <Award className="h-10 w-10"/> My Winnings
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    A record of all your winning tickets. Congratulations!
                </p>
            </div>
            
             <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                             {[...new Set(yearMonthOptions.map(ym => ym.split('-')[0]))].map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {MONTHS.map((month, index) => (
                                <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {Object.keys(groupedWinnings).length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(groupedWinnings).map(([monthYear, entries]) => (
                        <div key={monthYear}>
                            <h2 className="text-2xl font-bold font-headline mb-4 flex items-center">
                                <Calendar className="mr-3 h-6 w-6 text-primary" />
                                {monthYear}
                            </h2>
                            <div className="space-y-4">
                                {entries.map(({ draw, winningTicket, round, prize }) => (
                                    <Card key={`${draw.id}-${winningTicket.id}`} className="shadow-md hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <CardTitle>{draw.name}</CardTitle>
                                            <CardDescription>
                                                Won on {utcToLocalString(draw.announcementDate, 'PPP')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Ticket className="h-10 w-10 text-primary" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Your Ticket</p>
                                                    <p className="text-2xl font-mono font-bold tracking-widest">{winningTicket.numbers}</p>
                                                </div>
                                            </div>
                                             <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Round</p>
                                                <p className="font-bold text-lg">{round === 4 ? "Grand Prize" : `Round ${round}`}</p>
                                            </div>
                                            {prize > 0 && (
                                                 <div className="text-center sm:text-right">
                                                    <p className="text-sm text-muted-foreground">Prize Won</p>
                                                    <p className="text-xl font-bold font-headline text-green-600">₹{prize.toLocaleString('en-IN')}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4"/>
                    <p className="text-lg">No winnings found for the selected period.</p>
                    <p>Keep playing, your lucky day might be just around the corner!</p>
                </div>
            )}
        </div>
    );
}