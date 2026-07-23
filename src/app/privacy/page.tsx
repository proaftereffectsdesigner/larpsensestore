import ParticlesBackground from "@/components/ParticlesBackground";
import { ShieldCheck, Database, Lock, Eye } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
      <ParticlesBackground />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-4xl mt-12 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-2xl mb-6 shadow-2xl shadow-accent/20">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Your privacy is critically important to us. Discover how LarpSenseStore collects, uses, and fiercely protects your personal data in our secure ecosystem.
          </p>
        </div>

        {/* Premium Content Card */}
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-12">
          
          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Database className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information Collection</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                We collect information from you when you register on our site, place an order, subscribe to our newsletter or fill out a form. The collected information includes your name, email address, and payment information as necessary to process your transaction seamlessly.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Eye className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information Usage</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Any of the information we collect from you may be used to personalize your experience, improve our website, enhance customer service, and process transactions securely. Your information, whether public or private, will never be sold, exchanged, transferred, or given to any other company for any reason without your explicit consent.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Protection</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                We implement a variety of rigorous security measures to maintain the absolute safety of your personal information when you place an order or enter, submit, or access your personal information. We offer the use of a secure server and advanced cryptographic protocols.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                We use cookies to help us remember and process the items in your shopping cart, understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction so that we can continually offer better site experiences and tools in the future.
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
