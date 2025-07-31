import { cn } from "@/lib/utils";

type TicketDisplayProps = {
  numbers: string[];
  className?: string;
};

export function TicketDisplay({ numbers, className }: TicketDisplayProps) {
  return (
    <div className={cn("flex justify-center gap-2 my-4", className)}>
      {numbers.map((num, index) => (
        <div
          key={index}
          className="w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-md border bg-primary/10 text-primary"
        >
          {num}
        </div>
      ))}
    </div>
  );
}
