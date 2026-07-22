"use client";

import { ShieldCheck, Zap, Star, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center z-10">
      
      {/* Trust Badge */}
      <div className="mb-8 flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-300 ml-2 border-l border-white/10 pl-2">
          Trusted by 5,000+ Gamers
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-white max-w-4xl leading-tight">
        Dominate the game with <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Premium Accounts
        </span>
      </h1>

      {/* Sub-headline */}
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
        Skip the grind and jump straight into the action. We provide 100% hand-verified, secure, and ready-to-play CS2 accounts with instant email delivery.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
        <button 
          onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2"
        >
          View Accounts <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full px-4">
        
        <div className="flex flex-col items-center p-6 bg-[#141414]/50 border border-white/5 rounded-3xl backdrop-blur-sm">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-white font-bold mb-2">Instant Delivery</h3>
          <p className="text-sm text-gray-400 text-center">Credentials sent to your email instantly after purchase.</p>
        </div>

        <div className="flex flex-col items-center p-6 bg-[#141414]/50 border border-white/5 rounded-3xl backdrop-blur-sm">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-white font-bold mb-2">100% Secure</h3>
          <p className="text-sm text-gray-400 text-center">Hand-verified accounts with a completely clean history. No VAC bans.</p>
        </div>

        <div className="flex flex-col items-center p-6 bg-[#141414]/50 border border-white/5 rounded-3xl backdrop-blur-sm sm:col-span-2 md:col-span-1">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/20">
            <Star className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-white font-bold mb-2">Full Access</h3>
          <p className="text-sm text-gray-400 text-center">You receive the login, password, and the original email address.</p>
        </div>

      </div>

    </div>
  );
}
