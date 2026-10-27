"use client";

import { useState } from "react";
import Image from "next/image";

export default function RewardsTab() {
  const [mode, setMode] = useState<'drop' | 'card'>('drop');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto min-h-[600px]">
      <div className="flex flex-col items-center text-center w-full">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-4">Daily Free Rewards</h2>
        <p className="text-[#f5f5f7]/60 max-w-lg mb-8 text-sm md:text-base">
          Claim free LarpSense Coins or scratch mystery discount cards once every 24 hours. Level up your account to unlock higher drop chances.
        </p>

        {/* Reward Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-[#141414] border border-[#262626] rounded-2xl mb-12">
          <button 
            onClick={() => setMode('drop')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${mode === 'drop' ? 'bg-[#f5f5f7] text-black' : 'text-[#f5f5f7]/60 hover:text-white'}`}
          >
            Daily Case Drop
          </button>
          <button 
            onClick={() => setMode('card')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${mode === 'card' ? 'bg-[#f5f5f7] text-black' : 'text-[#f5f5f7]/60 hover:text-white'}`}
          >
            Mystery Scratch Card
          </button>
        </div>

        {mode === 'drop' && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300 w-full flex-1">
            <div className="w-72 h-56 bg-[#0a0a0a] border border-[#262626] rounded-2xl mb-12 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#404040] transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              
              <Image src="/logo.png" width={100} height={100} className="object-contain z-10 transition-transform duration-500 group-hover:scale-110" alt="Currency" />
              <div className="text-[#f5f5f7]/50 text-xs font-bold uppercase tracking-widest mt-6 z-10">LarpSense Coin</div>
            </div>
            
            <button className="bg-[#f5f5f7] text-black font-semibold px-12 py-4 rounded-full hover:bg-white transition-colors text-sm">
              Open Drop (Free)
            </button>
            <p className="text-xs text-[#f5f5f7]/30 mt-4 font-mono uppercase tracking-widest">Available once every 24 hours</p>
          </div>
        )}

        {mode === 'card' && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300 w-full flex-1">
            {/* The Pack/Card container */}
            <div className="w-60 h-80 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#262626] rounded-2xl mb-12 relative flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-colors">
              {/* Foil/Holo effect simulation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-20 h-20 rounded-full border-2 border-[#262626] bg-[#0a0a0a] flex items-center justify-center mb-6">
                   <span className="text-4xl text-[#f5f5f7]/80 font-black">?</span>
                </div>
                <div className="text-center px-4">
                  <div className="text-white font-black uppercase tracking-widest text-xl mb-1">Mystery Card</div>
                  <div className="text-[#f5f5f7]/40 text-[10px] font-bold uppercase tracking-widest mt-2">Contains 1 Discount</div>
                </div>
              </div>
            </div>

            <button className="bg-[#f5f5f7] text-black font-semibold px-12 py-4 rounded-full hover:bg-white transition-colors text-sm">
              Reveal Card
            </button>
            <p className="text-xs text-[#f5f5f7]/30 mt-4 font-mono uppercase tracking-widest">Available once every 24 hours</p>
          </div>
        )}

      </div>
    </div>
  );
}
