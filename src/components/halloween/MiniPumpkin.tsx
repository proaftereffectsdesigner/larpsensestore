"use client";

import React from "react";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

interface MiniPumpkinProps {
  className?: string;
  withGlow?: boolean;
}

export default function MiniPumpkin({ className = "w-5 h-5" }: MiniPumpkinProps) {
  if (!HALLOWEEN_EVENT_ENABLED) return null;
  return (
    <span className={`inline-flex items-center justify-center relative select-none ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Pumpkin Body Gradient */}
          <radialGradient id="pumpkinGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="60%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>

          {/* Candle Flame for Carvings */}
          <radialGradient id="carveGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
        </defs>

        {/* Stem */}
        <path
          d="M 16 6 C 16 3, 18 2, 19 2 C 18 4, 17 5, 16.8 6"
          stroke="#15803d"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Outer Pumpkin Lobes (Left & Right) */}
        <ellipse cx="9" cy="18" rx="6" ry="8.5" fill="url(#pumpkinGrad)" />
        <ellipse cx="23" cy="18" rx="6" ry="8.5" fill="url(#pumpkinGrad)" />

        {/* Mid Pumpkin Lobes */}
        <ellipse cx="12.5" cy="18" rx="5.5" ry="9" fill="url(#pumpkinGrad)" />
        <ellipse cx="19.5" cy="18" rx="5.5" ry="9" fill="url(#pumpkinGrad)" />

        {/* Center Lobe */}
        <ellipse cx="16" cy="18.5" rx="5" ry="9.2" fill="url(#pumpkinGrad)" />

        {/* Pumpkin Ridge Lines */}
        <path d="M 16 9 C 12 11, 10 24, 16 27.5" stroke="#7c2d12" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M 16 9 C 20 11, 22 24, 16 27.5" stroke="#7c2d12" strokeWidth="0.5" fill="none" opacity="0.4" />

        {/* Carved Eyes */}
        <polygon points="11,15 14,15 12.5,12" fill="url(#carveGlow)" />
        <polygon points="18,15 21,15 19.5,12" fill="url(#carveGlow)" />

        {/* Carved Nose */}
        <polygon points="15.2,17.5 16.8,17.5 16,16" fill="url(#carveGlow)" />

        {/* Carved Jagged Smile */}
        <path
          d="M 10 21 Q 16 26 22 21 Q 19 23 16 23 Q 13 23 10 21 Z"
          fill="url(#carveGlow)"
        />
        {/* Teeth notch */}
        <rect x="13.5" y="21" width="1.2" height="1.4" fill="#7c2d12" />
        <rect x="17.5" y="22.2" width="1.2" height="1.4" fill="#7c2d12" />
      </svg>
    </span>
  );
}
