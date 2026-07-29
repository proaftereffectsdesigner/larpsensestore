import FAQ from "@/components/FAQ";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function FAQPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      <ParticlesBackground />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-4xl mt-12 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our NFA system, delivery, and warranty.
          </p>
        </div>

        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10">
          <FAQ />
        </div>
      </div>
    </div>
  );
}
