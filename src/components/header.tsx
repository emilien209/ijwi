"use client";

import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { Vote } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

const navLinks = [
    { href: "/dashboard", key: "navDashboard" },
    { href: "/results", key: "navResults" },
    { href: "/verify", key: "navVerify" },
    { href: "/admin", key: "navAdmin" },
];

export function Header() {
  const { dict } = useDictionary();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Vote className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">{dict.appName}</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium flex-1">
            {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "transition-colors hover:text-primary",
                        pathname.startsWith(link.href) && link.href !== '/' ? "text-primary" : "text-muted-foreground",
                        pathname === '/' && link.href === '/' && "text-primary",
                         // Handle nested admin routes
                        link.href === '/admin' && pathname.startsWith('/admin/') ? "text-primary" : ""
                    )}
                >
                    {dict[link.key as keyof typeof dict]}
                </Link>
            ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
