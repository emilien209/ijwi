import { Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
      </div>
      {children}
    </div>
  );
}
