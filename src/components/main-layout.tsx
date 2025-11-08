"use client";

import { Header } from "./header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
  );
}
