"use client";

import React from "react";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

export default function HalloweenMoon() {
  if (!HALLOWEEN_EVENT_ENABLED) return null;

  return (
    <div className="absolute top-10 left-6 sm:left-14 md:left-24 z-10 pointer-events-none select-none overflow-visible">
      {/* Deep gothic purple & warm harvest amber atmospheric glow blending into the night forest */}
      <div className="absolute -inset-16 rounded-full bg-purple-700/15 blur-3xl pointer-events-none" />
      <div className="absolute -inset-10 rounded-full bg-orange-600/15 blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: "5s" }} />

      {/* Moon Disc with Screen Blend Mode so it merges naturally with the background */}
      <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full mix-blend-screen opacity-90 drop-shadow-[0_0_28px_rgba(251,146,60,0.4)]">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="harvestMoonGrad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="40%" stopColor="#fed7aa" />
              <stop offset="75%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.4" />
            </radialGradient>

            <radialGradient id="craterDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9a3412" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#431407" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Moon Disc */}
          <circle cx="50" cy="50" r="46" fill="url(#harvestMoonGrad)" />

          {/* Craters & Dark Lunar Seas */}
          <ellipse cx="62" cy="38" rx="12" ry="8" fill="url(#craterDark)" transform="rotate(-15 62 38)" />
          <ellipse cx="38" cy="60" rx="14" ry="10" fill="url(#craterDark)" transform="rotate(20 38 60)" />
          <circle cx="68" cy="52" r="7" fill="url(#craterDark)" />
          <circle cx="32" cy="42" r="5" fill="url(#craterDark)" />

          {/* Rim Rings */}
          <circle cx="48" cy="32" r="3" stroke="#ea580c" strokeWidth="0.6" strokeOpacity="0.3" fill="none" />
          <circle cx="36" cy="65" r="4" stroke="#ea580c" strokeWidth="0.6" strokeOpacity="0.3" fill="none" />
        </svg>

        {/* Drifting Night Fog / Mist Veil */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-35 mix-blend-overlay">
          <div
            className="w-[200%] h-full bg-gradient-to-r from-transparent via-purple-300/40 to-transparent blur-[2px]"
            style={{ animation: "moonMist 12s linear infinite" }}
          />
        </div>

        {/* Flying Silhouette Bat 1 */}
        <div
          className="absolute -top-3 -right-8 opacity-80"
          style={{ animation: "batFly1 9s ease-in-out infinite" }}
        >
          <svg className="w-6 h-6 text-neutral-950 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c-1.5-2.5-4-3-6-2.5 1 2 0.5 4-1.5 5.5 3 0.5 4.5 2 5 4.5 0.8-1 1.7-1.5 2.5-1.5s1.7 0.5 2.5 1.5c0.5-2.5 2-4 5-4.5-2-1.5-2.5-3.5-1.5-5.5-2-0.5-4.5 0-6 2.5z" />
          </svg>
        </div>

        {/* Flying Silhouette Bat 2 */}
        <div
          className="absolute top-8 right-12 opacity-70"
          style={{ animation: "batFly2 11s ease-in-out infinite 2s" }}
        >
          <svg className="w-4 h-4 text-neutral-950 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7c-1.5-2.5-4-3-6-2.5 1 2 0.5 4-1.5 5.5 3 0.5 4.5 2 5 4.5 0.8-1 1.7-1.5 2.5-1.5s1.7 0.5 2.5 1.5c0.5-2.5 2-4 5-4.5-2-1.5-2.5-3.5-1.5-5.5-2-0.5-4.5 0-6 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
