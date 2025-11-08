
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  LayoutDashboard,
  Shield,
  Users,
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
} from '@/components/ui/sidebar';
import { useDictionary } from '@/hooks/use-dictionary';


const adminNavLinks = [
    { href: "/admin", labelKey: "navDashboard", icon: LayoutDashboard },
    { href: "/admin/candidates", labelKey: "navCandidates", icon: Users },
    { href: "/admin/results", labelKey: "navResults", icon: BarChart2 },
    { href: "/admin/fraud-detection", labelKey: "navFraud", icon: Shield },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { dict } = useDictionary();

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="font-bold">{dict.admin.title}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {adminNavLinks.map(link => (
                        <SidebarMenuItem key={link.href}>
                             <Link href={link.href} passHref legacyBehavior>
                                <SidebarMenuButton isActive={pathname === link.href}>
                                    <link.icon />
                                    <span>{dict[link.labelKey as keyof typeof dict]}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
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
