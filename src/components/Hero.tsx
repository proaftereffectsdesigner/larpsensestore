"use client";

import Link from "next/link";
import { ArrowDown, Download, ShieldCheck, Zap, RefreshCw, KeyRound } from "lucide-react";
import { HALLOWEEN_EVENT_ENABLED } from "./halloween/HalloweenConfig";
import MiniPumpkin from "./halloween/MiniPumpkin";

export default function Hero() {
  const handleScrollToProducts = () => {
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="w-full pt-16 pb-12 md:pt-24 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content Block */}
        <div className="flex flex-col items-center text-center">
          
          {/* Prominent Halloween Sale Announcement */}
          {HALLOWEEN_EVENT_ENABLED ? (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-500 text-black font-extrabold text-sm sm:text-base tracking-wide uppercase">
                <MiniPumpkin className="w-4 h-4 text-black -mt-0.5" />
                -15% OFF
              </span>
              <span className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                Halloween Sale on All Accounts
              </span>
            </div>
          ) : (
            <div className="text-xs font-mono tracking-widest uppercase text-neutral-400 mb-6">
              LarpSense Store
            </div>
          )}

          {/* Headline: Clean, Confident, Razor-Sharp */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
            Cheap CS2 &amp; Rust Accounts. <br />
            <span className="text-neutral-400">Delivered in seconds.</span>
          </h1>

          {/* Subtitle: Plain, simple English without jargon */}
          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-xl font-normal mb-8">
            Premier-ready CS2 accounts and Rust accounts with hours. Fast delivery with a 6-hour replacement warranty.
          </p>

          {/* Action Buttons: Clean Apple White + Dark Pill */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-12">
            <button 
              type="button"
              onClick={handleScrollToProducts}
              className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-black hover:bg-neutral-200 text-sm font-semibold tracking-tight inline-flex items-center justify-center gap-2.5 transition-colors duration-200 cursor-pointer"
            >
              <span>View Accounts</span>
              {HALLOWEEN_EVENT_ENABLED && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-bold">
                  -15%
                </span>
              )}
              <ArrowDown className="w-4 h-4" />
            </button>

            <Link 
              href="/tool" 
              className="w-full sm:w-auto h-11 px-7 rounded-full bg-[#161618] text-[#f5f5f7] hover:bg-[#202024] hover:text-white border border-white/10 hover:border-white/20 text-sm font-semibold tracking-tight inline-flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span>Download Tool</span>
            </Link>
          </div>

          {/* Minimalist 4-Column Guarantee Strip: Simple plain words */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111113]/60 border border-white/5 text-left">
              <Zap className="w-4 h-4 text-[#48c931] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white tracking-tight">Fast Delivery</p>
                <p className="text-[11px] text-neutral-500">Ready in under 60s</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111113]/60 border border-white/5 text-left">
              <KeyRound className="w-4 h-4 text-[#48c931] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white tracking-tight">Steam Guard</p>
                <p className="text-[11px] text-neutral-500">Easy one-click login</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111113]/60 border border-white/5 text-left">
              <RefreshCw className="w-4 h-4 text-[#48c931] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white tracking-tight">6-Hour Warranty</p>
                <p className="text-[11px] text-neutral-500">Free auto replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#111113]/60 border border-white/5 text-left">
              <ShieldCheck className="w-4 h-4 text-[#48c931] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white tracking-tight">Clean Accounts</p>
                <p className="text-[11px] text-neutral-500">No bans, ready to play</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
