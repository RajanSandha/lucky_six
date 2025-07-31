"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { draws, tickets as allTickets } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Dices, CreditCard, PartyPopper, ArrowLeft, Search } from 'lucide-react';
import { TicketDisplay } from '@/components/TicketDisplay';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Helper to generate a 6-digit string
const generate6DigitString = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');

export default function DrawDetailPage() {
  const [ticketNumbers, setTicketNumbers] = useState<string[]>(Array(6).fill(''));
  const [isPaid, setIsPaid] = useState(false);
  const [suggestedTickets, setSuggestedTickets] = useState<string[]>([]);
  const [availableFilteredTickets, setAvailableFilteredTickets] = useState<string[]>([]);
  const { toast } = useToast();
  
  const params = useParams();
  const id = params.id as string;
  const draw = useMemo(() => draws.find(d => d.id === id), [id]);

  const existingTicketNumbers = useMemo(() => {
    if (!draw) return new Set<string>();
    return new Set(allTickets.filter(t => t.drawId === draw.id).map(t => t.numbers));
  }, [draw]);

  const generateUniqueTicket = () => {
    let newTicket;
    do {
      newTicket = generate6DigitString();
    } while (existingTicketNumbers.has(newTicket));
    return newTicket;
  };
  
  useEffect(() => {
    if (draw) {
      const recommendations = Array.from({ length: 3 }, () => generateUniqueTicket());
      setSuggestedTickets(recommendations);
    }
  }, [draw, existingTicketNumbers]);

  useEffect(() => {
    const partialInput = ticketNumbers.join('').trim();
    if (partialInput.length > 1) {
      const findAvailable = () => {
        const found: string[] = [];
        let attempts = 0;
        while(found.length < 3 && attempts < 1000) {
          const randomTicket = generate6DigitString();
          if (!existingTicketNumbers.has(randomTicket) && randomTicket.includes(partialInput)) {
            if(!found.includes(randomTicket)) {
              found.push(randomTicket);
            }
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

  if (!draw) {
    notFound();
  }

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

  const selectTicket = (numbers: string) => {
    setTicketNumbers(numbers.split(''));
  }

  const isTicketComplete = ticketNumbers.every(num => num !== '');

  const handlePayment = () => {
    toast({
      title: "Processing Payment...",
      description: "Please complete the payment on your UPI app.",
    });

    setTimeout(() => {
      setIsPaid(true);
      toast({
        title: "Payment Successful!",
        description: `Your ticket ${ticketNumbers.join('')} has been purchased. Good luck!`,
      });
    }, 2000);
  };
  
  if (isPaid) {
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
            <TicketDisplay numbers={ticketNumbers} />
            <p className="mt-4 text-sm text-muted-foreground">We wish you the best of luck. Winners will be announced on {draw.endDate.toLocaleDateString()}.</p>
          </CardContent>
          <CardContent>
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
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
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
             {availableFilteredTickets.length === 0 && (
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
            disabled={!isTicketComplete} 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            size="lg"
          >
            <CreditCard className="mr-2 h-5 w-5"/> Pay ₹{draw.ticketPrice} with UPI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
