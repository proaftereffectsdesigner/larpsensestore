"use client";

import React, { useState } from "react";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

export default function SpiderWeb() {
  const [spooked, setSpooked] = useState(false);
  const [showBoo, setShowBoo] = useState(false);

  if (!HALLOWEEN_EVENT_ENABLED) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpooked(true);
    setShowBoo(true);
    setTimeout(() => setShowBoo(false), 2400);
    setTimeout(() => setSpooked(false), 1400);
  };

  return (
    <div className="fixed top-0 right-0 z-[70] pointer-events-none select-none overflow-visible">
      {/* Corner Spiderweb SVG - Crisp vector lines, zero glow */}
      <svg
        className="w-36 h-36 md:w-52 md:h-52 opacity-40 hover:opacity-75 transition-opacity duration-300 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Radial structural threads radiating from top-right corner (200, 0) */}
        <line x1="200" y1="0" x2="0" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <line x1="200" y1="0" x2="0" y2="60" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="20" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="60" y2="170" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="120" y2="195" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

        {/* Concentric spiral web arcs */}
        <path d="M 170 0 Q 170 20 185 15 Q 192 10 200 10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M 135 0 Q 140 38 165 42 Q 185 35 200 35" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M 95 0 Q 105 60 140 70 Q 175 65 200 68" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
        <path d="M 50 0 Q 65 85 110 105 Q 160 100 200 105" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M 10 0 Q 30 115 80 145 Q 140 145 200 155" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Dangling Silk Thread & Animated Spider - Hanging comfortably below navbar */}
      <div
        className={`absolute top-0 right-14 md:right-20 origin-top transition-all duration-500 ease-out cursor-pointer pointer-events-auto group ${
          spooked ? "translate-y-4 scale-110 rotate-12" : "translate-y-0"
        }`}
        style={{
          animation: spooked ? "none" : "spiderSway 5s ease-in-out infinite",
        }}
        onClick={handleClick}
        title="Click me!"
      >
        {/* Silk line hanging down past navbar height */}
        <div className="w-[1px] h-28 md:h-36 bg-white/20 mx-auto" />

        {/* Spider Body */}
        <div className="relative -mt-1 flex flex-col items-center">
          {/* Spider SVG - Crisp, zero glow */}
          <svg
            className="w-7 h-7 md:w-9 md:h-9 text-neutral-900 transition-transform group-hover:scale-115"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Legs - Left */}
            <path d="M 18 18 Q 10 10 4 14" stroke="#4a044e" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 18 20 Q 8 18 2 24" stroke="#581c87" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 18 22 Q 8 26 4 32" stroke="#581c87" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 19 24 Q 12 32 8 38" stroke="#4a044e" strokeWidth="1.6" strokeLinecap="round" />

            {/* Legs - Right */}
            <path d="M 22 18 Q 30 10 36 14" stroke="#4a044e" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 22 20 Q 32 18 38 24" stroke="#581c87" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 22 22 Q 32 26 36 32" stroke="#581c87" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M 21 24 Q 28 32 32 38" stroke="#4a044e" strokeWidth="1.6" strokeLinecap="round" />

            {/* Abdomen (Main body) */}
            <ellipse cx="20" cy="24" rx="5.5" ry="7" fill="#18181b" stroke="#7e22ce" strokeWidth="1" />
            {/* Hourglass/skull marking on back */}
            <path d="M 19 22 L 21 22 L 20 24 L 21 26 L 19 26 Z" fill="#ea580c" opacity="0.9" />

            {/* Cephalothorax (Head) */}
            <circle cx="20" cy="16" r="3.5" fill="#27272a" stroke="#a855f7" strokeWidth="0.8" />

            {/* Spider Eyes */}
            <circle cx="18.5" cy="15" r="0.9" fill="#ff5500" />
            <circle cx="21.5" cy="15" r="0.9" fill="#ff5500" />
          </svg>

          {/* Boo popup bubble - Crisp solid badge, zero glow */}
          {showBoo && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white text-[11px] font-bold tracking-wider px-3 py-1 rounded-full border border-orange-500/50 animate-bounce pointer-events-none z-[80]">
              BOO! 👻
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
