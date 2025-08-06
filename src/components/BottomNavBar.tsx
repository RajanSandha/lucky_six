
"use client";

import Link from "next/link";
import { Ticket, Award, Megaphone, SlidersHorizontal, UserCircle2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { href: "/draws", label: "Draws", public: true, icon: Ticket },
    { href: "/announcements", label: "Results", public: true, icon: Megaphone },
    { href: "/my-winnings", label: "Winnings", public: true, requiresAuth: true, icon: Award },
    { href: "/admin/draws", label: "Admin", admin: true, icon: SlidersHorizontal },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.admin) return isAdmin;
    if (item.requiresAuth) return !!user;
    return item.public;
  });

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group",
                 pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        <div className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group text-muted-foreground">
            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <button className="inline-flex flex-col items-center justify-center w-full h-full">
                            <UserCircle2 className="w-5 h-5 mb-1" />
                            <span className="text-xs">Profile</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
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
                <Link href="/auth/login" className="inline-flex flex-col items-center justify-center w-full h-full">
                    <UserCircle2 className="w-5 h-5 mb-1" />
                    <span className="text-xs">Login</span>
                </Link>
            )}
        </div>
      </div>
    </div>
  );
}
