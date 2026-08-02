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
              <h2 className="text-2xl font-bold text-white mb-4">1. About these terms</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                LarpSense is an independent marketplace that sells access to game accounts. These terms are the agreement between you and LarpSense for using the site and buying through it.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                By accessing and placing an order with LarpSenseStore, you confirm that you are in agreement with and bound by these Terms of Service. These terms apply to the entire website and any communication between you and LarpSenseStore.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. What you are buying</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                We sell access to game accounts via secure account files, delivered digitally. The details for each listing are shown on the product page before you pay. Read them carefully, because that is exactly what you are buying.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                LarpSense is not affiliated with, endorsed by, or operated by Valve, Steam, or any game publisher. Their trademarks belong to them. The game accounts remain subject to those companies' own terms, which you are responsible for reviewing.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">3. Third-party platform risk</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                Game publishers set their own rules for accounts, and some restrict or prohibit selling, sharing, or transferring them. Any action a publisher takes on an account, such as a lock, ban, or reclaim, is outside our control.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                Beyond the replacement warranty outlined below, you accept this risk when you buy. Use our services at your own discretion.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <RefreshCw className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">4. Digital content and your right to cancel</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                Accounts are digital content delivered instantly, and an account file cannot be returned once it has been generated for you. Where you have a statutory cooling-off right, such as the 14-day right of withdrawal for consumers in the EU, it normally applies to digital purchases.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                By placing your order and choosing immediate delivery, you expressly ask us to begin performance right away and you acknowledge that you lose that cooling-off right for any item once its access file has been shown or delivered to you. Items that were never delivered keep their refund rights in full.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">5. Replacement warranty</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                Each order includes a 6-hour replacement warranty (or the window shown on the product page). If an account fails to log in as delivered within that window, you can contact support for a diagnostic. This is the fastest fix, and usually instant.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                The warranty covers accounts that fail to log in as delivered. It does not cover bans or locks caused by your own activity, game or anti-cheat bans, region locks tied to your use, changes you make after delivery, or claims that break these terms.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">6. Acceptable use & Anti-Fraud</h2>
              <p className="text-gray-400 leading-relaxed text-lg mb-4">
                Do not use the store for anything illegal, and do not attempt to defraud us or the payment providers.
              </p>
              <ul className="text-gray-400 leading-relaxed text-lg list-disc pl-6 space-y-2 mb-4">
                <li>No chargebacks or payment disputes opened in bad faith. Contact support first and we will help. Opening a dispute after receiving a functional account will result in an immediate blacklist of your IP, HWID, and wallet address.</li>
                <li>No attempts to bypass stock limits, fraud checks, rate limits, or the checkout process.</li>
                <li>No automated or bulk purchasing, scraping, or abuse outside our official API.</li>
                <li>No sharing or reselling delivered account files to game the warranty.</li>
              </ul>
              <p className="text-gray-400 leading-relaxed text-lg">
                We may refuse, hold, or cancel an order, and may block an email, address, wallet, or region, if we detect fraud or abuse.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact Information</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Questions about these terms? Reach us through the support desk on our Discord, and include your order link so we can help fast. <br />
                Or contact us at: <a href="mailto:support@larpsensestore.com" className="text-accent hover:underline">support@larpsensestore.com</a>
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
