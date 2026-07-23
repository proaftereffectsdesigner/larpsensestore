import ProductCards from "@/components/ProductCards";
import ParticlesBackground from "@/components/ParticlesBackground";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      {/* Tło (Particles) */}
      <ParticlesBackground />

      <div className="relative z-10 w-full flex flex-col items-center">
        <Hero />
        
        <div id="products" className="w-full mt-12 scroll-mt-24">
          <ProductCards />
        </div>

        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </div>
    </div>
  );
}
