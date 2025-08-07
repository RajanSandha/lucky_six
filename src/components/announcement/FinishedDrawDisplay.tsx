
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Draw, FullTicket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { utcToLocalString } from '@/lib/date-utils';
import { updatePrizeStatus } from '@/app/admin/draws/actions';
import { STAGE_CONFIG, WINNER_MESSAGES, getTicketsByIds } from './utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketCard } from '../TicketCard';
import { Crown, PartyPopper, Phone, MessageSquare } from 'lucide-react';

const PRIZE_STATUS_OPTIONS = {
    pending_confirmation: 'Pending Confirmation',
    address_confirmed: 'Address Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered'
};

export default function FinishedDrawDisplay({ draw, allTickets }: { draw: Draw; allTickets: FullTicket[] }) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [winnerMessage, setWinnerMessage] = useState('');
  
  const finalWinnerId = draw.winningTicketId || draw.announcedWinners?.[4]?.[0] || '';
  const finalWinnerTicket = allTickets.find(t => t.id === finalWinnerId);
  const winner = finalWinnerTicket?.user;
  const winnerName = winner?.name || 'Anonymous';
  const winnerInitials = winnerName.split(' ').map(n => n[0]).join('');

  useEffect(() => {
    if (user && winner && user.id === winner.id) {
        setWinnerMessage(WINNER_MESSAGES[Math.floor(Math.random() * WINNER_MESSAGES.length)]);
    }
  }, [user, winner]);

  const round3Winners = getTicketsByIds(draw.roundWinners?.[3] || [], allTickets);
  const round2Winners = getTicketsByIds(draw.roundWinners?.[2] || [], allTickets);
  const round1Winners = getTicketsByIds(draw.roundWinners?.[1] || [], allTickets);

  const handleStatusChange = async (newStatus: Draw['prizeStatus']) => {
    if (!draw.id || !newStatus) return;
    const result = await updatePrizeStatus(draw.id, newStatus);
    if(result.success) {
      toast({ title: 'Status Updated', description: result.message });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">{draw.name} - Results</h1>
        <p className="text-muted-foreground mt-2">The ceremony concluded on {utcToLocalString(new Date(draw.announcementDate), 'PPpp')}</p>
      </div>

      <Card className="max-w-4xl mx-auto shadow-2xl overflow-hidden border-accent">
        <div className="p-8 bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground">
           <CardHeader className="text-center p-0">
                <div className="mx-auto bg-background/20 p-4 rounded-full w-fit mb-4 backdrop-blur-sm">
                    <Crown className="h-12 w-12 text-white"/>
                </div>
                <CardTitle className="text-4xl font-headline tracking-tight">Grand Prize Winner</CardTitle>
            </CardHeader>
             <CardContent className="text-center p-0 mt-6">
                {winner ? (
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-white/50">
                            <AvatarFallback className="bg-primary/50 text-3xl font-bold">{winnerInitials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-3xl font-bold font-headline">{winnerName}</h3>
                        {winnerMessage && (
                            <div className="flex items-center gap-2 text-lg font-semibold bg-white/20 p-3 rounded-lg text-white">
                                <PartyPopper className="h-6 w-6"/>
                                <p>{winnerMessage}</p>
                            </div>
                        )}
                        <div className="bg-background/20 backdrop-blur-sm rounded-lg p-4 w-full max-w-sm">
                             <p className="text-sm opacity-80 mb-1">Winning Ticket</p>
                             <p className="text-4xl font-mono tracking-widest">{finalWinnerTicket?.numbers}</p>
                        </div>
                    </div>
                ): (
                    <p>Winner details not available.</p>
                )}
            </CardContent>
        </div>
        {isAdmin && winner && (
          <CardContent className='p-4'>
            <h3 className="font-bold text-lg mb-2 text-center">Admin Fulfillment Info</h3>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
              <div>
                <p className="font-semibold">Winner Contact:</p>
                <p className='text-muted-foreground'>{winner.phone}</p>
              </div>
              <div className='flex items-center gap-2'>
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${winner.phone}`}><Phone className='mr-2'/> Call</a>
                </Button>
                 <Button asChild variant="outline" size="sm">
                  <a href={`https://wa.me/${winner.phone.replace('+', '')}`} target="_blank" rel="noopener noreferrer"><MessageSquare className='mr-2' /> WhatsApp</a>
                </Button>
              </div>
            </div>
            <Separator className="my-4"/>
            <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                <p className="font-semibold">Prize Status:</p>
                <Select onValueChange={handleStatusChange} defaultValue={draw.prizeStatus || 'pending_confirmation'}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIZE_STATUS_OPTIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="max-w-4xl mx-auto mt-8">
        <h3 className="text-2xl font-bold font-headline mb-4 text-center">Round Results</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[3].title} ({round3Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
              {round3Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} round={3} isSelected />)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[2].title} ({round2Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {round2Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} round={2} isSelected/>)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">{STAGE_CONFIG[1].title} ({round1Winners.length} Winners)</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {round1Winners.map(ticket => <TicketCard key={ticket.id} ticket={ticket} round={1} isSelected/>)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </div>
  )
}
