import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
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
import HalloweenEvent from "@/components/halloween/HalloweenEvent";

const inter = Inter({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.larpsensestore.com"),
  icons: {
    icon: [
      { url: "/logo.png?v=2", type: "image/png" },
    ],
    shortcut: "/logo.png?v=2",
    apple: "/logo.png?v=2",
  },
  title: {
    default: "LarpSense Store | Cheap CS2 NFA Accounts & Premier Ready Smurfs",
    template: "%s | LarpSense Store",
  },
  description: "Buy verified cheap CS2 NFA accounts, Premier ready smurfs & Prime status accounts from €0.79. Automated instant delivery, 6h warranty & proprietary security client.",
  keywords: [
    "cs2 nfa accounts",
    "cheap cs2 accounts",
    "buy cs2 premier ready",
    "cs2 premier smurf account",
    "cheap prime accounts cs2",
    "cs2 premier accounts cheap",
    "rust nfa accounts",
    "larpsense store",
    "instant delivery gaming accounts"
  ],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "WSOTDMZ1Cu08DMOokoL8ve3CDCDNuPC3xMlgENZGclA",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "LarpSense Store | Cheap CS2 NFA Accounts & Premier Ready Smurfs",
    description: "Buy verified cheap CS2 NFA accounts, Premier ready smurfs & Prime accounts. Instant automated delivery with 6-hour warranty.",
    url: "https://www.larpsensestore.com",
    siteName: "LarpSense Store",
    images: [
      {
        url: "/embed.png",
        width: 1200,
        height: 630,
        alt: "LarpSense Store - Cheap CS2 NFA Accounts",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LarpSense Store | Cheap CS2 NFA Accounts & Premier Ready Smurfs",
    description: "Buy verified cheap CS2 NFA accounts, Premier ready smurfs & Prime accounts. Instant automated delivery with 6-hour warranty.",
    images: ["/embed.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.larpsensestore.com/#organization",
      "name": "LarpSense Store",
      "url": "https://www.larpsensestore.com",
      "logo": "https://www.larpsensestore.com/logo.png",
      "sameAs": ["https://discord.gg/qVxdgvdTSK"],
      "description": "Secure marketplace for verified gaming accounts with automated warranty and instant delivery."
    },
    {
      "@type": "WebSite",
      "@id": "https://www.larpsensestore.com/#website",
      "url": "https://www.larpsensestore.com",
      "name": "LarpSense Store",
      "publisher": { "@id": "https://www.larpsensestore.com/#organization" }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo.png?v=2" />
        <link rel="shortcut icon" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} antialiased bg-[#0a0a0a] text-[#ededed] min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <CurrencyProvider>
          <PresenceTracker>
            <HalloweenEvent />
            <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <TopUpModal />
          <AuthModal />
            <Toaster 
              theme="dark" 
              position="bottom-right" 
              toastOptions={{
                style: {
                  background: '#141414',
                  border: '1px solid #262626',
                  color: '#f5f5f7',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  fontSize: '13px',
                  fontWeight: '500'
                }
              }}
            />
          </PresenceTracker>
        </CurrencyProvider>
      </body>
    </html>
  );
}
