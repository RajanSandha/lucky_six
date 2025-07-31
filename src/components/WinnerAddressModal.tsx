"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

export function WinnerAddressModal() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, you would submit this data to your backend
    console.log("Address submitted");
    toast({
      title: "Address Submitted!",
      description: "We've received your address and will ship your prize soon.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Claim Your Prize</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Congratulations, Winner!</DialogTitle>
            <DialogDescription>
              Please enter your address to claim your prize. We'll ship it to you right away.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input id="name" defaultValue="Alice" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address1" className="text-right">
                Address
              </Label>
              <Input id="address1" placeholder="Street Address" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input id="city" placeholder="e.g., Mumbai" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pincode" className="text-right">
                Pincode
              </Label>
              <Input id="pincode" placeholder="e.g., 400001" className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Submit Address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
