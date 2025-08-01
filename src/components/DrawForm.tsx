"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Draw } from "@/lib/types";
import { createDraw, updateDraw } from "@/app/admin/draws/actions";

interface DrawFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  draw?: Draw | null;
}

// Helper to format date to yyyy-MM-ddThh:mm
const formatDateTimeLocal = (date: Date) => {
  const ten = (i: number) => (i < 10 ? "0" : "") + i;
  const YYYY = date.getFullYear();
  const MM = ten(date.getMonth() + 1);
  const DD = ten(date.getDate());
  const HH = ten(date.getHours());
  const II = ten(date.getMinutes());
  return `${YYYY}-${MM}-${DD}T${HH}:${II}`;
};


export function DrawForm({ open, onOpenChange, onSuccess, draw }: DrawFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!draw;

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = isEditing
      ? await updateDraw(draw.id, formData)
      : await createDraw(formData);

    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
      onSuccess();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">
              {isEditing ? "Edit Draw" : "Create New Draw"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details for this draw."
                : "Fill in the details below to schedule a new draw."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Draw Name</Label>
              <Input id="name" name="name" placeholder="e.g., Summer Super Draw" defaultValue={draw?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Draw Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" />
              {isEditing && draw?.imageUrl && <p className="text-xs text-muted-foreground">Current image is set. Upload a new file to replace it.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A brief description of the draw" defaultValue={draw?.description} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prize">Prize Amount (₹)</Label>
                <Input id="prize" name="prize" type="number" placeholder="e.g., 500000" defaultValue={draw?.prize} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Ticket Price (₹)</Label>
                <Input id="ticketPrice" name="ticketPrice" type="number" placeholder="e.g., 10" defaultValue={draw?.ticketPrice} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="datetime-local" defaultValue={draw ? formatDateTimeLocal(new Date(draw.startDate)) : ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="datetime-local" defaultValue={draw ? formatDateTimeLocal(new Date(draw.endDate)) : ''} required />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="announcementDate">Announcement Date</Label>
                <Input id="announcementDate" name="announcementDate" type="datetime-local" defaultValue={draw ? formatDateTimeLocal(new Date(draw.announcementDate)) : ''} required />
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
              {isEditing ? "Save Changes" : "Create Draw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
