
"use client";

import Link from "next/link";
import { Ticket, Award, Megaphone, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

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
  
  const gridColsClass = `grid-cols-${visibleNavItems.length}`;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className={cn("grid h-full max-w-lg mx-auto font-medium", gridColsClass)}>
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
      </div>
    </div>
  );
}
