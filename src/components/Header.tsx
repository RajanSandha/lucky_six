
"use client";

import Link from "next/link";
import { Ticket, Menu, LogOut, Megaphone, Gift, Shield, Award, SlidersHorizontal, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
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

        {/* Desktop Nav */}
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

        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Desktop Auth */}
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

          {/* Mobile Auth */}
          <div className="md:hidden">
             {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <UserCircle2 className="h-6 w-6" />
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                             <p className="font-semibold">{user.name}</p>
                             <p className="text-sm font-normal text-muted-foreground">{user.phone}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                 <Button asChild variant="ghost" size="sm">
                    <Link href="/auth/login">Login</Link>
                </Button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
