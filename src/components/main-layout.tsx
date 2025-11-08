"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminAuthPage = pathname === '/admin/auth';
  
  if (isAdminAuthPage) {
    return <main>{children}</main>;
  }

  return (
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
  );
}
