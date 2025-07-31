"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";
import { createDraw, getDraws } from "./actions";
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

export default function DrawsAdminPage() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draws, setDraws = useState<Draw[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDraws() {
        setIsLoading(true);
        const fetchedDraws = await getDraws();
        setDraws(fetchedDraws);
        setIsLoading(false);
    }
    fetchDraws();
  }, []);
  
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createDraw(formData);

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
      const fetchedDraws = await getDraws();
      setDraws(fetchedDraws);
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Draws Management</h1>
            <p className="text-lg text-muted-foreground mt-2">Create, view, and manage all lottery draws.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Draw
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleFormSubmit}>
              <DialogHeader>
                <DialogTitle className="font-headline">Create New Draw</DialogTitle>
                <DialogDescription>
                  Fill in the details below to schedule a new draw.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Draw Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Summer Super Draw" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="image">Draw Image</Label>
                  <Input id="image" name="image" type="file" accept="image/*" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="A brief description of the draw" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="prize">Prize Amount (₹)</Label>
                        <Input id="prize" name="prize" type="number" placeholder="e.g., 500000" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ticketPrice">Ticket Price (₹)</Label>
                        <Input id="ticketPrice" name="ticketPrice" type="number" placeholder="e.g., 10" required />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" name="startDate" type="datetime-local" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" name="endDate" type="datetime-local" required />
                    </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Draw
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
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
                    <TableHead>Ticket Price (₹)</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></TableCell></TableRow>}
                {!isLoading && draws.map((draw) => {
                    const isActive = new Date(draw.endDate) > new Date();
                    return (
                    <TableRow key={draw.id}>
                        <TableCell className="font-medium">{draw.name}</TableCell>
                        <TableCell>{draw.prize.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{draw.ticketPrice}</TableCell>
                        <TableCell>{new Date(draw.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500/20 text-green-700" : ""}>
                            {isActive ? "Active" : "Finished"}
                        </Badge>
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
