"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { BackgroundCarousel } from "./background-carousel";

const imageUrls = [
    "https://i.pinimg.com/736x/87/61/e7/8761e78a47397c2728a4761b25198b09.jpg",
    "https://i.pinimg.com/736x/8c/28/11/8c281124032816de60c3badc3c015296.jpg",
    "https://i.pinimg.com/736x/71/0e/5d/710e5d529088d9521e656e0164d92ccf.jpg",
    "https://i.pinimg.com/1200x/02/81/c4/0281c4daea7ed13b3fa7b4baf67486fd.jpg",
    "https://i.pinimg.com/736x/56/a4/0a/56a40a31bad654b20d5c64a31ecd71da.jpg",
];


export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminAuthPage = pathname === '/admin/auth';
  const isAdminSection = pathname.startsWith('/admin');

  if (isAdminAuthPage) {
    return <main>{children}</main>;
  }

  // Do not show background carousel for admin section
  if (isAdminSection) {
      return (
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
      )
  }

  return (
      <div className="relative flex min-h-screen flex-col">
        <BackgroundCarousel images={imageUrls} />
        <div className="relative z-10 flex flex-1 flex-col">
            <Header />
            <main className="flex-1">{children}</main>
        </div>
      </div>
  );
}
