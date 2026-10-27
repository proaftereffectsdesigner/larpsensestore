import React from "react";

export default function LSCoinIcon({ className = "w-6 h-6", color = "#22c55e" }: { className?: string, color?: string }) {
  const isGenericColor = color === "currentColor" || !color;
  const actualColor = isGenericColor ? "#22c55e" : color;

  return (
    <div 
      className={`relative flex items-center justify-center rounded-full bg-[#1c1c1c] shrink-0 ${className}`}
      style={{ 
        boxShadow: `
          inset 0 -4px 6px rgba(0,0,0,0.7), 
          inset 0 2px 4px rgba(255,255,255,0.06), 
          0 4px 10px rgba(0,0,0,0.4), 
          0 0 0 2px #0a0a0a
        ` 
      }}
    >
      <div 
        className="absolute inset-[10%] rounded-full opacity-90 pointer-events-none"
        style={{ 
          border: `1.5px solid ${actualColor}`, 
          boxShadow: `inset 0 0 8px ${actualColor}30, 0 0 6px ${actualColor}40` 
        }}
      />
      <div 
        className="relative w-[55%] h-[55%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] pointer-events-none"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </div>
  );
}
