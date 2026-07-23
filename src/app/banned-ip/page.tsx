import React from 'react';
import { ShieldAlert } from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function BannedIpPage() {
  return (
    <>
      <ParticlesBackground />
      <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-4 text-center">
        <div className="bg-[#141414] border border-red-500/20 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.15)] max-w-lg w-full flex flex-col items-center relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-64 h-64 bg-red-500/10 rounded-full blur-3xl mix-blend-screen"></div>
          </div>

          <ShieldAlert className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          
          <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">
            Access Denied
          </h1>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            Your connection has been blocked. This device or IP address is associated with a banned account. Ban evasion is not permitted on this platform.
          </p>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent mb-8"></div>
          
          <div className="text-xs text-red-500/50 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Connection Terminated
          </div>
        </div>
      </div>
    </>
  );
}
