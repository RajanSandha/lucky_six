
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Loader2 } from "lucide-react";
import { getDraw } from "@/app/admin/draws/actions";
import type { Draw } from "@/lib/types";

interface ReferralInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawId: string;
}

export function ReferralInfoDialog({ open, onOpenChange, drawId }: ReferralInfoDialogProps) {
  const [draw, setDraw] = useState<Draw | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (drawId) {
      const fetchDraw = async () => {
        setIsLoading(true);
        const fetchedDraw = await getDraw(drawId);
        setDraw(fetchedDraw);
        setIsLoading(false);
      };
      fetchDraw();
    }
  }, [drawId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-4">
             <Gift className="h-10 w-10 text-accent-foreground" />
          </div>
          <DialogTitle className="font-headline text-center text-2xl">You've Been Invited!</DialogTitle>
          <DialogDescription className="text-center">
            A friend has invited you to join Lucky Six.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading offer details...</p>
            </div>
          ) : draw ? (
            <>
                <p className="font-semibold text-lg">Here's a special welcome gift:</p>
                <p className="text-muted-foreground mt-2">
                    Complete your registration now, and you'll both receive a{' '}
                    <span className="font-bold text-primary">FREE ticket</span> for the{' '}
                    <span className="font-bold text-primary">"{draw.name}"</span> draw!
                </p>
            </>
          ) : (
             <p className="text-destructive">Could not load the referral offer details. Please try again later.</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild className="w-full">
            <Button type="button" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Sounds Good!
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
