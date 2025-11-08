"use client";

import { LanguageProvider } from "@/contexts/language-context";
import { Header } from "./header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </LanguageProvider>
  );
}
