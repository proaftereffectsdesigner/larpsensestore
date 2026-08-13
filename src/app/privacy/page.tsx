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
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                We collect information when you register, place an order, or use our services. The collected information may include your Discord ID (if linked), email address, and payment details processed securely by our payment providers.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                For strict security and anti-fraud purposes, our automated systems may also securely log your IP address, device hardware identifiers (HWID), and basic access metrics when you use our website or the LarpSense NFA Tool.
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
                The information we collect is used to fulfill your digital orders, provide customer support, improve our website, and enforce our Anti-Fraud & Chargeback policies. Your private information will never be sold, exchanged, or transferred to any unauthorized third party without your explicit consent.
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
                We implement a variety of rigorous security measures to maintain the safety of your personal information. We utilize secure server infrastructure, Discord OAuth for secure authentication, and native Windows DPAPI encryption within our LarpSense NFA Tool to ensure your session data never leaves your device unencrypted.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services & Cookies</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                We use cookies and local storage to remember your session and process items in your cart. We also partner with trusted third-party providers (like Stripe or Oxapay) for payment processing and Discord for customer support. These providers have their own strict privacy policies governing the data they process on our behalf.
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
