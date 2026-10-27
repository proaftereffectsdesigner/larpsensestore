import ProductCards from "@/components/ProductCards";
import ParticlesBackground from "@/components/ParticlesBackground";
import WhyBuy from "@/components/WhyBuy";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 pt-0">
      <div className="relative z-10 w-full flex flex-col items-center">
        <Hero />
        
        <div id="products" className="w-full scroll-mt-24">
          <ProductCards />
        </div>

        <WhyBuy />
        <SocialProof />
        <FAQ />
      </div>
    </div>
  );
}
