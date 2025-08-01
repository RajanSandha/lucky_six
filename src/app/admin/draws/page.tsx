"use client";

import { useState, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { getDraws, deleteDraw } from "./actions";
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

function DrawsAdminPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const getDrawStatus = (draw: Draw): { text: string; variant: "default" | "secondary" | "outline"; className?: string } => {
    const now = new Date();
    const startDate = new Date(draw.startDate);
    const endDate = new Date(draw.endDate);

    if (now < startDate) {
      return { text: "Upcoming", variant: "outline", className: "border-blue-500/50 text-blue-600" };
    } else if (now >= startDate && now <= endDate) {
      return { text: "Active", variant: "default", className: "bg-green-500/20 text-green-700" };
    } else {
      return { text: "Finished", variant: "secondary" };
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Draws Management</h1>
            <p className="text-lg text-muted-foreground mt-2">Create, view, and manage all lottery draws.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Draw
        </Button>
        <DrawForm
            key={selectedDraw?.id || 'new'}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={handleFormSuccess}
            draw={selectedDraw}
        />
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
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></TableCell></TableRow>}
                {!isLoading && draws.map((draw) => {
                    const status = getDrawStatus(draw);
                    const isEditable = new Date(draw.endDate) > new Date();

                    return (
                    <TableRow key={draw.id}>
                        <TableCell className="font-medium">{draw.name}</TableCell>
                        <TableCell>{draw.prize.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{new Date(draw.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(draw.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                        <Badge variant={status.variant} className={status.className}>
                            {status.text}
                        </Badge>
                        </TableCell>
                         <TableCell className="text-right">
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
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                                  </Description>
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
