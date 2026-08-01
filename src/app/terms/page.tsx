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
              <h2 className="text-2xl font-bold text-white mb-4">2. Digital Goods & EU Right of Withdrawal Waiver</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                By placing your order and choosing immediate delivery, you expressly ask and consent us to begin performance right away, and you acknowledge that you lose your EU 14-day cooling-off / withdrawal right for any digital item once its login credentials or access token have been shown or generated for you.
              </p>
              <ul className="text-gray-400 leading-relaxed text-lg list-disc pl-6 space-y-2">
                <li>If the software or account is non-functional within 6 hours, please contact support for a diagnostic.</li>
                <li>If we verify that the issue is server-side or account-related, we will provide a replacement or store credit.</li>
                <li>The warranty does not cover restrictions resulting from user actions after the product has been successfully delivered and accessed.</li>
              </ul>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Anti-Fraud & Chargeback Policy</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Opening a chargeback or payment dispute after receiving a functional account or valid token is classified as payment fraud. Doing so will result in an immediate and permanent blacklist of your email, IP address, device hardware IDs (HWID), and wallet addresses across our network and partner merchants. All automatic server delivery logs, timestamped webhook activations, and DPAPI usage proofs will be systematically forwarded to our payment processors and your card issuer to vigorously contest and win any fraudulent dispute.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Account Security & Liability</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                You are responsible for maintaining the security of your LarpSenseStore account credentials. While we take every measure to secure our platform and provide safe products, LarpSense LTD is not liable for bans, restrictions, or damages incurred on third-party platforms (such as Steam) as a result of using our services. Use at your own discretion.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Modification of Terms</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                LarpSenseStore reserves the right to revise or update these Terms of Service. We will notify users of significant changes via our Discord community or email. By continuing to use this website after changes are made, you agree to be bound by the most current version.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Contact Information</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                If you have any questions about these Terms of Service or need support with your order, please contact us at: <br />
                <a href="mailto:support@larpsensestore.com" className="text-accent hover:underline">support@larpsensestore.com</a>
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
