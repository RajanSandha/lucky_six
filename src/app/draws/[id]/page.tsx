
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Dices, CreditCard, PartyPopper, ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { TicketDisplay } from '@/components/TicketDisplay';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Draw, Ticket as TicketType } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { purchaseTicket } from './actions';

// Helper to generate a 6-digit string
const generate6DigitString = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

export default function DrawDetailPage() {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [ticketNumbers, setTicketNumbers] = useState<string[]>(Array(6).fill(''));
  const [lastPurchasedTicket, setLastPurchasedTicket] = useState<string[] | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [suggestedTickets, setSuggestedTickets] = useState<string[]>([]);
  const [availableFilteredTickets, setAvailableFilteredTickets] = useState<string[]>([]);
  const [existingTicketNumbers, setExistingTicketNumbers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  
  const params = useParams();
  const id = params.id as string;
  
  const fetchDrawAndTickets = async () => {
    setIsLoading(true);
    const drawRef = doc(db, 'draws', id);
    const drawSnap = await getDoc(drawRef);

    if (drawSnap.exists()) {
        const drawData = drawSnap.data();
        const fetchedDraw = {
            id: drawSnap.id,
            ...drawData,
            startDate: drawData.startDate.toDate(),
            endDate: drawData.endDate.toDate(),
        } as Draw;
        setDraw(fetchedDraw);

        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('drawId', '==', id));
        const ticketSnapshot = await getDocs(q);
        const ticketNumbersSet = new Set(ticketSnapshot.docs.map(doc => doc.data().numbers as string));
        setExistingTicketNumbers(ticketNumbersSet);
        
        const generateUniqueTicket = () => {
          let newTicket;
          do {
            newTicket = generate6DigitString();
          } while (ticketNumbersSet.has(newTicket));
          return newTicket;
        };
        const recommendations = Array.from({ length: 3 }, () => generateUniqueTicket());
        setSuggestedTickets(recommendations);
    } else {
        notFound();
    }
    setIsLoading(false);
  };


  useEffect(() => {
    if (!id) return;
    fetchDrawAndTickets();
  }, [id]);

  useEffect(() => {
    const hasInput = ticketNumbers.some(n => n !== '');
    if (hasInput) {
      const findAvailable = () => {
        const found: string[] = [];
        let attempts = 0;
        // This is a naive search and can be slow with many tickets. For production, a more robust search/DB query is needed.
        while(found.length < 3 && attempts < 10000) {
          const randomTicket = generate6DigitString();
          if (existingTicketNumbers.has(randomTicket)) {
            attempts++;
            continue;
          }

          let matches = true;
          for(let i = 0; i < 6; i++) {
            if(ticketNumbers[i] !== '' && ticketNumbers[i] !== randomTicket[i]) {
              matches = false;
              break;
            }
          }

          if (matches && !found.includes(randomTicket)) {
              found.push(randomTicket);
          }
          attempts++;
        }
        return found;
      }
      setAvailableFilteredTickets(findAvailable());
    } else {
      setAvailableFilteredTickets([]);
    }
  }, [ticketNumbers, existingTicketNumbers]);
  
  const generateUniqueTicket = () => {
    let newTicket;
    do {
      newTicket = generate6DigitString();
    } while (existingTicketNumbers.has(newTicket));
    return newTicket;
  };

  const generateRandomTicket = () => {
    const randomNumbers = generateUniqueTicket().split('');
    setTicketNumbers(randomNumbers);
  };

  const handleInputChange = (index: number, value: string) => {
    if (/^[0-9]$/.test(value) || value === '') {
      const newTicketNumbers = [...ticketNumbers];
      newTicketNumbers[index] = value;
      setTicketNumbers(newTicketNumbers);

      if (value !== '' && index < 5) {
        document.getElementById(`ticket-input-${index + 1}`)?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && ticketNumbers[index] === '' && index > 0) {
      document.getElementById(`ticket-input-${index - 1}`)?.focus();
    }
  };

  const selectTicket = (numbers: string) => {
    setTicketNumbers(numbers.split(''));
  }

  const isTicketComplete = useMemo(() => ticketNumbers.every(num => num !== ''), [ticketNumbers]);
  
  const resetForNewPurchase = () => {
    setIsPaid(false);
    setLastPurchasedTicket(null);
    setTicketNumbers(Array(6).fill(''));
    // Refetch tickets to ensure our local list is up-to-date
    fetchDrawAndTickets(); 
  };

  const handlePayment = async () => {
    if (!user) {
        toast({ title: "Not Logged In", description: "You must be logged in to purchase a ticket.", variant: "destructive" });
        return;
    }
    if (!draw) return;

    setIsBuying(true);
    toast({
      title: "Processing Payment...",
      description: "Please complete the payment on your UPI app.",
    });

    // Simulate payment delay
    setTimeout(async () => {
      const finalTicketNumber = ticketNumbers.join('');
      const result = await purchaseTicket(draw.id, user.id, finalTicketNumber);

      if (result.success) {
        setLastPurchasedTicket(ticketNumbers);
        setIsPaid(true);
        toast({
          title: "Payment Successful!",
          description: `Your ticket ${finalTicketNumber} has been purchased. Good luck!`,
        });
      } else {
        toast({
          title: "Purchase Failed",
          description: result.message,
          variant: "destructive"
        });
        // If ticket was taken, let's refresh the available tickets
        if (result.message?.includes('taken')) {
            fetchDrawAndTickets();
        }
      }
      setIsBuying(false);
    }, 2000);
  };
  
  if (isLoading) {
    return <div className="container mx-auto py-12 px-4 flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!draw) {
    // This will be handled by notFound() in useEffect, but as a fallback:
    return <div className="container mx-auto py-12 px-4 text-center"><p>Draw not found.</p></div>;
  }

  if (isPaid && lastPurchasedTicket) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center text-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader>
            <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-4 rounded-full w-fit">
              <PartyPopper className="h-12 w-12 text-green-500"/>
            </div>
          </CardHeader>
          <CardContent>
            <h1 className="text-3xl font-bold font-headline text-primary">Congratulations!</h1>
            <p className="text-muted-foreground mt-2 mb-4">You're officially in the draw.</p>
            <p className="font-semibold">Your ticket number is:</p>
            <TicketDisplay numbers={lastPurchasedTicket} />
            <p className="mt-4 text-sm text-muted-foreground">We wish you the best of luck. Winners will be announced on {draw.endDate.toLocaleDateString()}.</p>
          </CardContent>
          <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={resetForNewPurchase} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4"/>
              Purchase Another Ticket
            </Button>
            <Button asChild>
              <Link href="/draws">Back to Draws</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/draws"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Draws</Link>
      </Button>
      <Card className="w-full max-w-2xl mx-auto shadow-lg overflow-hidden">
        {draw.imageUrl && (
            <div className="relative h-64 w-full">
                <Image src={draw.imageUrl} alt={draw.name} layout="fill" objectFit="cover" data-ai-hint="lottery prize" />
            </div>
        )}
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{draw.name}</CardTitle>
          <CardDescription>Prize: ₹{draw.prize.toLocaleString('en-IN')} | Draw ends on: {draw.endDate.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Enter Your 6-Digit Number</h3>
              <div className="flex justify-center gap-2">
                {ticketNumbers.map((num, index) => (
                  <input
                    key={index}
                    id={`ticket-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={num}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-md border bg-muted/50 text-foreground focus:ring-2 focus:ring-ring"
                  />
                ))}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">OR</p>
            
            <Button variant="outline" onClick={generateRandomTicket}>
              <Dices className="mr-2 h-4 w-4"/> Generate Random Ticket
            </Button>
          </div>
        </CardContent>

        <CardContent>
          <div className="space-y-4">
            {availableFilteredTickets.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground mb-2"><Search className="h-4 w-4" /> Available based on your input:</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableFilteredTickets.map((ticket) => (
                      <Button key={ticket} variant="outline" size="sm" onClick={() => selectTicket(ticket)}>
                        {ticket}
                      </Button>
                    ))}
                  </div>
                </div>
            )}
             {availableFilteredTickets.length === 0 && ticketNumbers.every(n => n === '') && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Feeling lucky? Try one of these:</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedTickets.map((ticket) => (
                      <Button key={ticket} variant="outline" size="sm" onClick={() => selectTicket(ticket)}>
                        {ticket}
                      </Button>
                    ))}
                  </div>
                </div>
             )}
          </div>
        </CardContent>

        <CardContent>
          <Button 
            onClick={handlePayment} 
            disabled={!isTicketComplete || isBuying} 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            size="lg"
          >
            {isBuying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5"/>}
            {isBuying ? "Processing..." : `Pay ₹${draw.ticketPrice} with UPI`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
