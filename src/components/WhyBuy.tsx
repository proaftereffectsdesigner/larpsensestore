"use client";

import { Hammer } from "lucide-react";

export default function WhyBuy() {
  return (
    <section className="w-full max-w-screen-2xl mx-auto py-16 px-4 sm:px-8">
      <div className="w-full rounded-[32px] bg-[#111113] border border-white/5 p-8 sm:p-14 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Subtle status tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-400 mb-6">
          <Hammer className="w-3.5 h-3.5 text-neutral-400" />
          <span>Work in progress</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4 max-w-2xl">
          We&apos;re preparing something special for you.
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-lg">
          This section is currently under construction. Stay tuned for new features, client integrations, and exclusive perks coming soon.
        </p>

      </div>
    </section>
  );
}
