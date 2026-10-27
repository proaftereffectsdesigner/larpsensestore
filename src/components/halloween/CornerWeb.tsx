"use client";

import React from "react";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

interface CornerWebProps {
  className?: string;
}

export default function CornerWeb({ className = "w-20 h-20" }: CornerWebProps) {
  if (!HALLOWEEN_EVENT_ENABLED) return null;

  return (
    <div className={`absolute top-0 right-0 pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-25"
      >
        {/* Radial structural threads radiating from top-right corner (100, 0) */}
        <line x1="100" y1="0" x2="0" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="100" y1="0" x2="0" y2="35" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
        <line x1="100" y1="0" x2="20" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
        <line x1="100" y1="0" x2="60" y2="95" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

        {/* Concentric arcs */}
        <path d="M 85 0 Q 86 12 95 10 Q 98 8 100 8" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" fill="none" />
        <path d="M 68 0 Q 72 24 85 24 Q 94 20 100 20" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" fill="none" />
        <path d="M 45 0 Q 52 42 70 45 Q 88 40 100 42" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none" />
        <path d="M 20 0 Q 32 65 55 72 Q 80 68 100 70" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" fill="none" />
      </svg>
    </div>
  );
}
