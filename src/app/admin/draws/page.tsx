
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2, Trophy, TestTube2, Megaphone, PlayCircle } from "lucide-react";
import { getDraws, deleteDraw, runScheduler } from "./actions";
import { createMockData } from "./[id]/announce/actions";
import type { Draw } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import withAdminAuth from '@/components/withAdminAuth';
import { DrawForm } from "@/components/DrawForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const getDrawStatus = (draw: Draw): { text: string; variant: "default" | "secondary" | "outline"; className?: string } => {
  const now = new Date();
  const startDate = new Date(draw.startDate);
  const endDate = new Date(draw.endDate);
  
  if (draw.status === 'finished') {
    return { text: "Completed", variant: "secondary" };
  } else if (draw.status === 'announcing') {
     return { text: "Announcing", variant: "default", className: "bg-purple-500/20 text-purple-700 animate-pulse" };
  } else if (now < startDate) {
    return { text: "Upcoming", variant: "outline", className: "border-blue-500/50 text-blue-600" };
  } else if (now >= startDate && now <= endDate) {
    return { text: "Active", variant: "default", className: "bg-green-500/20 text-green-700" };
  } else if (now > endDate) {
     return { text: "Awaiting Winner", variant: "outline", className: "border-yellow-500/50 text-yellow-700" };
  } else {
     return { text: "Unknown", variant: "outline"};
  }
}

function MockDataDialog({ drawId, onOpenChange, onSuccess }: { drawId: string, onOpenChange: (open:boolean) => void, onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState(50);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsLoading(true);
        const result = await createMockData(drawId, count);
        if (result.success) {
            toast({ title: "Success!", description: result.message });
            onSuccess();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsLoading(false);
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Generate Mock Data for Draw</DialogTitle>
                <DialogDescription>
                    This will create mock users and tickets for this draw. This is for testing purposes only.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="ticket-count">Number of Tickets to Generate</Label>
                <Input 
                    id="ticket-count" 
                    type="number" 
                    value={count} 
                    onChange={(e) => setCount(Number(e.target.value))} 
                    max={100}
                    min={1}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}


function DrawsAdminPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMocking, setIsMocking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const { toast } = useToast();

  const fetchDraws = async () => {
      setIsLoading(true);
      const fetchedDraws = await getDraws();
      setDraws(fetchedDraws);
      setIsLoading(false);
  };
  
  useEffect(() => {
    fetchDraws();
  }, []);
  
  const handleFormSuccess = () => {
    fetchDraws();
    setIsFormOpen(false);
    setSelectedDraw(null);
  }

  const handleEditClick = (draw: Draw) => {
    setSelectedDraw(draw);
    setIsFormOpen(true);
  }

  const handleCreateClick = () => {
    setSelectedDraw(null);
    setIsFormOpen(true);
  }
  
  const handleMockClick = (draw: Draw) => {
    setSelectedDraw(draw);
    setIsMocking(true);
  }

  const handleDelete = async (drawId: string) => {
    setIsDeleting(true);
    const result = await deleteDraw(drawId);
     if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
      fetchDraws();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  }

  const handleRunScheduler = async () => {
      setIsSchedulerRunning(true);
      const result = await runScheduler();
      if (result.success) {
        toast({ title: "Success!", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
      setIsSchedulerRunning(false);
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Draws Management</h1>
            <p className="text-lg text-muted-foreground mt-2">Create, view, and manage all lottery draws.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleRunScheduler} disabled={isSchedulerRunning}>
                {isSchedulerRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Run Scheduler
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCreateClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Draw
            </Button>
        </div>
        <DrawForm
            key={selectedDraw?.id || 'new-draw'}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={handleFormSuccess}
            draw={selectedDraw}
        />
        <Dialog open={isMocking} onOpenChange={setIsMocking}>
           {selectedDraw && <MockDataDialog drawId={selectedDraw.id} onOpenChange={setIsMocking} onSuccess={fetchDraws} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>All Draws</CardTitle>
            <CardDescription>A list of all scheduled and past draws.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prize (₹)</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Announcement Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></TableCell></TableRow>}
                {!isLoading && draws.map((draw) => {
                    const status = getDrawStatus(draw);
                    const isEditable = status.text === "Upcoming";
                    const canAnnounce = status.text === "Awaiting Winner" || status.text === "Announcing";
                    const canBeDeleted = !draw.status || draw.status === 'upcoming'; 

                    return (
                    <TableRow key={draw.id}>
                        <TableCell className="font-medium">{draw.name}</TableCell>
                        <TableCell>{draw.prize.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{new Date(draw.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{draw.announcementDate ? new Date(draw.announcementDate).toLocaleString() : 'Not Set'}</TableCell>
                        <TableCell>
                        <Badge variant={status.variant} className={status.className}>
                            {status.text}
                        </Badge>
                        </TableCell>
                         <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                             {canAnnounce && (
                                <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                  <Link href={`/admin/draws/${draw.id}/announce`}>
                                      <Megaphone className="mr-2 h-4 w-4" />
                                      View Ceremony
                                  </Link>
                                </Button>
                              )}
                            <AlertDialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClick(draw)} disabled={!isEditable}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMockClick(draw)}>
                                    <TestTube2 className="mr-2 h-4 w-4" />
                                    Generate Mock Data
                                  </DropdownMenuItem>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={!canBeDeleted}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the draw
                                      "{draw.name}". You can only delete draws with no purchased tickets.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(draw.id)}
                                      disabled={isDeleting}
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Yes, delete it
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           </div>
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminAuth(DrawsAdminPage);
