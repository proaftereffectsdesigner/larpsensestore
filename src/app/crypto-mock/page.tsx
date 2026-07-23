import ParticlesBackground from "@/components/ParticlesBackground";
import { Bitcoin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CryptoMockPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-emerald-500/30 selection:text-emerald-200">
      <ParticlesBackground />
      
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6">
        <div className="bg-[#111] border border-white/5 p-12 rounded-3xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <Bitcoin className="w-12 h-12 text-amber-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 tracking-tight">Crypto Integration Pending</h1>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            This is a placeholder page for the upcoming Cryptocurrency payment gateway. Once you provide the API keys and documentation, users will be redirected here to complete their transaction via Coinbase Commerce or NowPayments.
          </p>
          
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Go back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
