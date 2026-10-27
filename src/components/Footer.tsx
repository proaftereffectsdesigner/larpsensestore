"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MiniPumpkin from "./halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "./halloween/HalloweenConfig";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/7evenejoyer')) {
    return null;
  }

  return (
    <footer className="border-t border-white/5 mt-auto relative z-20">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="flex flex-col">
            <h3 className="font-semibold text-[12px] mb-3 text-white">Games</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/shop?category=cs2" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Counter-Strike 2
                </Link>
              </li>
              <li>
                <Link href="/shop?category=rust" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Rust
                </Link>
              </li>
              <li>
                <Link href="/shop?category=extra" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Extra
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-[12px] mb-3 text-white">Account</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/dashboard?tab=profile" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Dashboard Profile
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=orders" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=tickets" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Support Tickets
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-[12px] mb-3 text-white">Support</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/faq" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support/affiliate" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Affiliate
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-[12px] mb-3 text-white">Community</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="https://discord.gg/qVxdgvdTSK" target="_blank" rel="noopener noreferrer" className="text-[12px] text-gray-400 hover:text-white transition-colors">
                  Discord Server
                </a>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 text-[12px] text-gray-500">
            <span className="flex items-center gap-1.5">
              Copyright &copy; {new Date().getFullYear()} LarpSense Store. All rights reserved.
              {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />}
            </span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-gray-700">|</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
          <div className="text-[12px] text-[#f5f5f7]/30">
            Not affiliated with Valve Corporation.
          </div>
        </div>
      </div>
    </footer>
  );
}
