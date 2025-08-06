

"use client";

import Link from "next/link";
import { Ticket, Menu, X, LogOut, Megaphone, Gift, Shield, Award, SlidersHorizontal, UserCircle2 } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { Separator } from "./ui/separator";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  
  const navItems = [
    { href: "/draws", label: "Draws", public: true, icon: Ticket },
    { href: "/announcements", label: "Draw Results", public: true, icon: Megaphone },
    { href: "/my-winnings", label: "My Winnings", public: true, requiresAuth: true, icon: Award },
    { href: "/admin/draws", label: "Draws Management", admin: true, icon: SlidersHorizontal },
  ];

  const visibleNavItems = navItems.filter(item => {
      if (item.admin) return isAdmin;
      if (item.requiresAuth) return !!user;
      return item.public;
  });

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
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary flex items-center gap-2",
                pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex items-center gap-2">
            {user ? (
                <>
                <span className="hidden sm:inline text-sm text-muted-foreground">Welcome, {user.name}!</span>
                <Button onClick={logout} variant="ghost" size="icon">
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Log Out</span>
                </Button>
                </>
            ) : (
                <>
                <Button asChild variant="ghost">
                    <Link href="/auth/login">Log In</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/auth/register">Register</Link>
                </Button>
                </>
            )}
          </div>


          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <SheetTitle className="sr-only">Main Menu</SheetTitle>
              <div className="flex items-center border-b pb-4">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                        <Ticket className="h-6 w-6 text-primary" />
                        <span className="font-bold font-headline text-lg">Lucky Six</span>
                    </Link>
                </div>
                <nav className="flex flex-col gap-4 mt-8 flex-1">
                  {visibleNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary flex items-center gap-3",
                        pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                    {user ? (
                        <>
                            <Separator className="my-4"/>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserCircle2 className="h-8 w-8 text-muted-foreground"/>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                                    </div>
                                </div>
                                <Button onClick={() => { logout(); setIsMenuOpen(false); }} variant="ghost" size="icon">
                                    <LogOut className="h-5 w-5"/>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Button asChild variant="outline" onClick={() => setIsMenuOpen(false)}>
                                    <Link href="/auth/login">Log In</Link>
                            </Button>
                            <Button asChild onClick={() => setIsMenuOpen(false)}>
                                <Link href="/auth/register">Register</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
