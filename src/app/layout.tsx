import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/main-layout';
import './globals.css';
import { LanguageProvider } from '@/contexts/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: "Ijwi ry'Umuturage",
  description: 'Secure and Accessible E-Voting Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-body antialiased ${ptSans.variable}`}>
        <FirebaseClientProvider>
            <LanguageProvider>
              <MainLayout>{children}</MainLayout>
            </LanguageProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
