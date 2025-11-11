
"use client";

import Link from "next/link";
import { useDictionary } from "@/hooks/use-dictionary";
import { Vote, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

export function AdminHeader() {
  const { dict } = useDictionary();
  const pathname = usePathname();
  
  if(pathname === '/admin/auth') return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/admin" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">{dict.admin.title}</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}

    