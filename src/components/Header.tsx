"use client";

import Link from "next/link";
import { Ticket, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/draws", label: "Draws" },
  { href: "/results", label: "Results" },
  { href: "/admin/fraud-detection", label: "Fraud Detection" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Lucky Six</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild variant="ghost">
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/auth/register">Register</Link>
          </Button>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
               <SheetTitle className="sr-only">Main Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b pb-4">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                        <Ticket className="h-6 w-6 text-primary" />
                        <span className="font-bold font-headline text-lg">Lucky Six</span>
                    </Link>
                    <SheetClose asChild>
                         <Button variant="ghost" size="icon">
                            <X className="h-5 w-5" />
                         </Button>
                    </SheetClose>
                </div>
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                   <Button asChild variant="outline" onClick={() => setIsMenuOpen(false)}>
                        <Link href="/auth/login">Log In</Link>
                    </Button>
                    <Button asChild onClick={() => setIsMenuOpen(false)}>
                        <Link href="/auth/register">Register</Link>
                    </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
