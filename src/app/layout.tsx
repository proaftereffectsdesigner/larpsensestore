import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import TopUpModal from "@/components/TopUpModal";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import PresenceTracker from "@/components/PresenceTracker";
import GlobalBanGuard from "@/components/GlobalBanGuard";
import { Toaster } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { CurrencyProvider } from '@/lib/CurrencyContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LarpSense Store | Premium NFA Accounts",
  description: "Secure, instant digital account delivery. Get your premium NFA accounts for a variety of games with automated warranty.",
  openGraph: {
    title: "LarpSense Store | Premium NFA Accounts",
    description: "Secure, instant digital account delivery. Get your premium NFA accounts for a variety of games today.",
    url: "https://www.larpsensestore.com",
    siteName: "LarpSenseStore",
    images: [
      {
        url: "/embed.png",
        width: 1200,
        height: 630,
        alt: "LarpSense Store",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LarpSense Store | Premium NFA Accounts",
    description: "Secure, instant digital account delivery. Get your premium NFA accounts for a variety of games today.",
    images: ["/embed.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-[#ededed] min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <CurrencyProvider>
          <PresenceTracker>
            <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <TopUpModal />
          <AuthModal />
            <Toaster theme="dark" position="bottom-right" richColors />
          </PresenceTracker>
        </CurrencyProvider>
      </body>
    </html>
  );
}
