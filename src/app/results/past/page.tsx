
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import type { PastDrawResult } from "./actions";
import { getPastDraws } from "./actions";
import { Loader2, Search, ArrowLeft, Award, Ticket as TicketIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { utcToLocalString } from "@/lib/date-utils";
import { Timestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate years from current year back to a certain point
const availableYears = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));


export default function PastResultsPage() {
    const [pages, setPages] = useState<PastDrawResult[][]>([[]]);
    const [nextCursor, setNextCursor] = useState<Timestamp | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterMonth, setFilterMonth] = useState<string>('all');
    
    const { ref, inView } = useInView();

    const fetchNextPage = useCallback(async () => {
        if (!hasMore || isLoading) return;
        setIsLoading(true);

        const filters = {
            year: filterYear === 'all' ? 'all' : Number(filterYear),
            month: filterMonth === 'all' ? 'all' : Number(filterMonth),
        };

        const result = await getPastDraws(nextCursor, filters);
        
        // This is a bit of a hack for client-side filtering with server-side pagination.
        // If the filtered result is empty but there's a next cursor, we fetch again.
        // A proper implementation would have server-side filtering.
        if (result.draws.length === 0 && result.nextCursor) {
             setNextCursor(result.nextCursor);
        } else {
            setPages(prev => [...prev, result.draws]);
            setNextCursor(result.nextCursor);
            setHasMore(result.nextCursor !== null);
        }

        setIsLoading(false);
    }, [nextCursor, hasMore, isLoading, filterYear, filterMonth]);
    
    const resetAndFetch = useCallback(async () => {
        setIsLoading(true);
        setPages([]);
        setHasMore(true);
        
        const filters = {
            year: filterYear === 'all' ? 'all' : Number(filterYear),
            month: filterMonth === 'all' ? 'all' : Number(filterMonth),
        };
        const result = await getPastDraws(null, filters);

        setPages([result.draws]);
        setNextCursor(result.nextCursor);
        setHasMore(result.nextCursor !== null);
        setIsLoading(false);
    }, [filterYear, filterMonth]);

    useEffect(() => {
        resetAndFetch();
    }, [filterYear, filterMonth]);


    useEffect(() => {
        if (inView) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage]);


    const allDraws = pages.flat();

    return (
        <div className="container mx-auto py-12 px-4">
             <Button variant="ghost" asChild className="mb-4">
                <Link href="/announcements"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Results</Link>
            </Button>
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                    All Past Results
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Browse the complete history of our concluded draws.
                </p>
            </div>
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {availableYears.map(year => (
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

            <div className="space-y-6">
                 {allDraws.map((draw) => {
                    const winnerName = draw.winner?.name || "Anonymous";
                    const winnerInitials = winnerName.split(' ').map(n => n[0]).join('');

                    return (
                        <Card key={draw.id} className="shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="font-headline text-2xl">{draw.name}</CardTitle>
                                    <CardDescription>
                                        Concluded on {utcToLocalString(new Date(draw.announcementDate), 'PP')}
                                    </CardDescription>
                                </div>
                                <Badge variant="default" className="bg-primary text-primary-foreground">
                                    Prize: ₹{draw.prize.toLocaleString('en-IN')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                    <Award className="h-8 w-8 text-accent-foreground mb-2" />
                                    <h3 className="font-semibold text-muted-foreground">Winner</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {winnerInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="text-lg font-bold font-headline text-primary">{winnerName}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                    <TicketIcon className="h-8 w-8 text-accent-foreground mb-2" />
                                    <h3 className="font-semibold text-muted-foreground">Winning Ticket</h3>
                                    <p className="text-lg font-bold font-mono tracking-widest text-primary">{draw.winningTicketId ? '******' : 'N/A'}</p>
                                </div>
                                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg justify-center">
                                    <Button asChild variant="outline">
                                        <Link href={`/announcements/${draw.id}`}>
                                            View Ceremony Details
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div ref={ref} className="mt-8 text-center">
                {isLoading && <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />}
                {!isLoading && !hasMore && allDraws.length > 0 && <p className="text-muted-foreground">You've reached the end of the results.</p>}
                {!isLoading && allDraws.length === 0 && (
                     <div className="text-center py-16 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4"/>
                        <p>No results found for the selected filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}