
import ParticlesBackground from "@/components/ParticlesBackground";
import TicketForm from "@/components/TicketForm";
import { Mail, MessageSquare } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      <ParticlesBackground />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-4xl mt-12 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-2xl mb-6 shadow-2xl shadow-accent/20">
            <MessageSquare className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Support Center
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Need help with your purchase? Check our FAQ page or reach out to our team directly. We're here to help.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <a href="https://discord.gg/qVxdgvdTSK" target="_blank" rel="noopener noreferrer" className="w-full max-w-md flex flex-col items-center justify-center p-8 bg-[#111]/80 backdrop-blur-xl border border-white/10 hover:border-[#5865F2]/30 rounded-3xl transition-all group">
            <div className="w-16 h-16 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <img src="/discord.png" alt="Discord" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Discord Community</h2>
            <p className="text-gray-400 text-center mb-4">Fastest response times. Open a ticket or join the community.</p>
            <span className="text-[#5865F2] font-medium">Join Server</span>
          </a>
        </div>

        <div className="mb-16">
          <TicketForm />
        </div>


      </div>
    </div>
  );
}
