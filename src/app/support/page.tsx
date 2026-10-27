
import { MessageSquare, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

export default function SupportHubPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 bg-[#050505]">
      
      {/* NO PARTICLES, NO GLOW */}
      
      <div className="relative z-10 w-full max-w-6xl mt-24 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-[#f5f5f7] mb-6 tracking-tight flex items-center justify-center gap-3">
            <span>Support</span>
            {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-8 h-8 md:w-11 md:h-11 -mt-1" />}
          </h1>
          <p className="text-[#f5f5f7]/50 text-lg max-w-2xl mx-auto font-medium">
            How can we help you today? Choose an option below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Support Ticket Card - MASSIVE */}
          <Link href="/support/ticket" className="group flex flex-col bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] rounded-3xl p-10 md:p-12 transition-colors relative overflow-hidden min-h-[360px]">
            {/* Live Chat Graphic Mockup */}
            <div className="absolute right-0 bottom-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500 translate-x-12 translate-y-12 rotate-[-5deg] pointer-events-none">
              <div className="bg-[#141414] border border-[#333] rounded-2xl p-5 w-72 shadow-2xl flex flex-col gap-4">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-[#47c92f]" />
                  <div className="h-3 w-32 bg-[#333] rounded-full" />
                </div>
                <div className="bg-[#47c92f]/20 border border-[#47c92f]/30 rounded-2xl rounded-tl-sm p-4 w-[85%] self-start">
                  <div className="h-2 w-full bg-[#47c92f]/50 rounded-full mb-2" />
                  <div className="h-2 w-2/3 bg-[#47c92f]/50 rounded-full" />
                </div>
                <div className="bg-[#262626] rounded-2xl rounded-tr-sm p-4 w-[85%] self-end">
                  <div className="h-2 w-full bg-[#555] rounded-full mb-2" />
                  <div className="h-2 w-1/2 bg-[#555] rounded-full" />
                </div>
              </div>
            </div>

            <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mb-8 relative z-10 border border-[#262626]">
              <MessageSquare className="w-8 h-8 text-[#f5f5f7]" />
            </div>
            <h3 className="text-3xl font-black text-[#f5f5f7] mb-4 relative z-10">Open a Ticket</h3>
            <p className="text-[#f5f5f7]/50 text-lg leading-relaxed max-w-sm mb-12 relative z-10 flex-1">
              Connect directly with our live support staff for personalized assistance with your orders.
            </p>
            <div className="flex items-center gap-3 relative z-10 mt-auto">
              <div className="bg-[#47c92f] text-black font-bold uppercase tracking-widest text-sm px-6 py-3 rounded-full flex items-center gap-2 group-hover:bg-[#3db028] transition-colors">
                Start Live Chat <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Affiliate Card - MASSIVE */}
          <Link href="/support/affiliate" className="group flex flex-col bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] rounded-3xl p-10 md:p-12 transition-colors relative overflow-hidden min-h-[360px]">
            {/* Money / % Graphic Mockup */}
            <div className="absolute right-0 bottom-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500 translate-x-8 translate-y-8 rotate-[5deg] pointer-events-none">
              <div className="bg-[#141414] border border-[#333] rounded-3xl p-8 w-72 shadow-2xl flex flex-col items-center justify-center gap-3">
                <div className="text-[#47c92f] text-7xl font-black tracking-tighter">10%</div>
                <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">Commission</div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <div className="px-4 py-2 rounded-full bg-[#47c92f]/20 border border-[#47c92f]/30 text-[#47c92f] text-sm font-bold">+$150.00</div>
                  <div className="px-4 py-2 rounded-full bg-[#47c92f]/20 border border-[#47c92f]/30 text-[#47c92f] text-sm font-bold">+$45.50</div>
                </div>
              </div>
            </div>

            <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mb-8 relative z-10 border border-[#262626]">
              <Users className="w-8 h-8 text-[#f5f5f7]" />
            </div>
            <h3 className="text-3xl font-black text-[#f5f5f7] mb-4 relative z-10">Affiliate Program</h3>
            <p className="text-[#f5f5f7]/50 text-lg leading-relaxed max-w-sm mb-12 relative z-10 flex-1">
              Apply to become a partner, track your earnings in real-time, and grow alongside LarpSense.
            </p>
            <div className="flex items-center gap-3 relative z-10 mt-auto">
              <div className="bg-[#f5f5f7] text-black font-bold uppercase tracking-widest text-sm px-6 py-3 rounded-full flex items-center gap-2 group-hover:bg-[#e5e5e7] transition-colors">
                Open Dashboard <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </Link>

        </div>

        {/* Discord Card - Smaller Footer Banner */}
        <a href="https://discord.gg/qVxdgvdTSK" target="_blank" rel="noopener noreferrer" className="group flex flex-col sm:flex-row items-center sm:items-start bg-[#0a0a0a] border border-[#262626] hover:border-[#5865F2]/50 rounded-2xl p-6 md:p-8 transition-colors text-center sm:text-left gap-6">
          <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center shrink-0 border border-[#262626] group-hover:border-[#5865F2]/30 transition-colors">
            <img src="/discord.png" alt="Discord" className="w-8 h-8 object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#f5f5f7] mb-2">Discord Community</h3>
            <p className="text-[#f5f5f7]/50 text-sm leading-relaxed max-w-2xl">
              Want to stay updated, ask quick questions, or interact with other LarpSense users? Join our Discord server. It's the best place to hang out and get community support.
            </p>
          </div>
          <div className="shrink-0 sm:self-center">
            <div className="border border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10 font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full transition-colors">
              Join Server
            </div>
          </div>
        </a>

      </div>
    </div>
  );
}
