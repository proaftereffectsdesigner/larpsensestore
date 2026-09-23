import { Metadata } from "next";
import { Suspense } from "react";
import ShopClient from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Browse CS2 & Rust NFA Accounts | LarpSense Store",
  description: "Browse our complete catalog of cheap CS2 Premier ready smurfs, Prime status accounts, and Rust NFA accounts. Instant automated delivery & 6h warranty.",
  alternates: {
    canonical: "https://www.larpsensestore.com/shop",
  },
  openGraph: {
    title: "Browse CS2 & Rust NFA Accounts | LarpSense Store",
    description: "Browse our full catalog of cheap CS2 Premier ready, Prime status, and Rust NFA accounts with instant delivery.",
    url: "https://www.larpsensestore.com/shop",
    siteName: "LarpSense Store",
    images: [
      {
        url: "/embed.png",
        width: 1200,
        height: 630,
        alt: "LarpSense Store Catalog",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse CS2 & Rust NFA Accounts | LarpSense Store",
    description: "Browse cheap CS2 Premier ready, Prime status, and Rust NFA accounts with instant delivery.",
    images: ["/embed.png"],
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-gray-500">Loading shop...</div>}>
      <ShopClient />
    </Suspense>
  );
}
