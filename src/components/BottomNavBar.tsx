
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
    { href: "/draws", label: "Draws", icon: Ticket, show: true },
    { href: "/announcements", label: "Results", icon: Megaphone, show: true },
    { href: "/my-winnings", label: "Winnings", icon: Award, show: !!user },
    { href: "/admin/draws", label: "Admin", icon: SlidersHorizontal, show: isAdmin },
  ];

  const visibleNavItems = navItems.filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="flex h-full max-w-lg mx-auto font-medium">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group w-full",
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
