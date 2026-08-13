import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkMeApp — Find Work. Find Help. Get Paid.",
  description:
    "The digital operating system for Kenya's informal economy. Find skilled workers or find work nearby, and get paid instantly via M-Pesa.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LinkMeApp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <div className="flex-1 pb-16">{children}</div>
        <NotificationBell />
        <BottomNav />
      </body>
    </html>
  );
}
