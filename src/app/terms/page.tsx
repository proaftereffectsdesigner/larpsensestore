import ParticlesBackground from "@/components/ParticlesBackground";
import { FileText, Shield, AlertCircle, RefreshCw } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      <ParticlesBackground />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-4xl mt-12 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-2xl mb-6 shadow-2xl shadow-accent/20">
            <FileText className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using LarpSenseStore. By accessing or using our premium digital services, you agree to be bound by the conditions outlined below.
          </p>
        </div>

        {/* Premium Content Card */}
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-12">
          
          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. General Conditions</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                By accessing and placing an order with LarpSenseStore, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and LarpSenseStore.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <RefreshCw className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Digital Products & Refunds</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                All products and services are delivered digitally immediately after purchase. Due to the nature of digital goods, we do not issue refunds once the order is confirmed and the product is delivered. We highly recommend contacting our support team if you experience any issues receiving, downloading, or using our products.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Security</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                You are strictly responsible for maintaining the confidentiality and security of your account credentials. LarpSenseStore cannot and will not be liable for any loss, damage, or unauthorized access resulting from your failure to comply with this security obligation.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Modification of Terms</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                LarpSenseStore reserves the right to revise, update, or modify these Terms of Service at any time without prior notice. By continuing to use this website after changes are made, you agree to be bound by the most current version of these Terms of Service.
              </p>
            </div>
          </section>

        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
