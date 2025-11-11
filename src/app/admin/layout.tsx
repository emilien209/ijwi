
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  LayoutDashboard,
  Shield,
  Users,
  LogOut,
  Vote,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useDictionary } from '@/hooks/use-dictionary';
import { useEffect, useState } from 'react';
import { ADMIN_AUTH_TOKEN } from './auth/page';
import { Button } from '@/components/ui/button';

const adminNavLinks = [
    { href: "/admin", labelKey: "navDashboard", icon: LayoutDashboard },
    { href: "/admin/candidates", labelKey: "navCandidates", icon: Users },
    { href: "/admin/results", labelKey: "navResults", icon: BarChart2 },
    { href: "/admin/fraud-detection", labelKey: "navFraud", icon: Shield },
    { href: "/admin/history", labelKey: "navHistory", icon: History },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dict } = useDictionary();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const hasToken = !!sessionStorage.getItem(ADMIN_AUTH_TOKEN);
    setIsAuthenticated(hasToken);
    if (!hasToken && pathname !== '/admin/auth') {
        router.replace('/admin/auth');
    }
  }, [pathname, router]);
  
  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_TOKEN);
    setIsAuthenticated(false);
    router.replace('/admin/auth');
  }

  if (isAuthenticated === null) {
      return (
          <div className="flex min-h-screen items-center justify-center">
              <p>{dict.admin.auth.loading}</p>
          </div>
      )
  }

  if (pathname === '/admin/auth') {
      return <>{children}</>;
  }

  if (!isAuthenticated) {
    // This will be shown briefly before redirection
    return (
      <div className="flex min-h-screen items-center justify-center">
          <p>{dict.admin.auth.redirecting}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <Vote className="h-6 w-6 text-primary" />
                    <span className="font-bold">{dict.admin.title}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {adminNavLinks.map(link => (
                        <SidebarMenuItem key={link.href}>
                             <Link href={link.href}>
                                <SidebarMenuButton isActive={pathname === link.href}>
                                    <link.icon />
                                    <span>{dict[link.labelKey as keyof typeof dict]}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <Button variant="ghost" onClick={handleLogout} className="justify-start">
                    <LogOut />
                    <span>{dict.admin.auth.logout}</span>
                </Button>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
             <div className="p-4 md:p-8">
                 <div className="md:hidden mb-4">
                    <SidebarTrigger />
                 </div>
                {children}
             </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
