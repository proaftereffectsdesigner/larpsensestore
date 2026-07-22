import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-gradient-to-b from-[#0a0a0a]/50 to-[#000000] backdrop-blur-2xl mt-auto relative z-20 overflow-hidden">
      {/* Ozdobny gradient w tle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
      
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Logo i Nazwa */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-4 text-2xl font-bold tracking-tight text-white mb-6 hover:opacity-80 transition-opacity">
              <div className="bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl">
                <img src="/logo.png" alt="LarpSense Logo" className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              </div>
              <div className="flex items-baseline">
                <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">LarpSense</span>
                <span className="font-light tracking-wide text-gray-500 ml-1">Store</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Your trusted destination for premium, instantly delivered digital accounts. Experience gaming without limits, backed by our lifetime guarantee.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3"></div> {/* Spacer */}

          {/* Szybkie linki */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold tracking-wider text-xs uppercase mb-6 text-gray-400">Legal Information</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white transition-colors"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white transition-colors"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-white font-bold tracking-wider text-xs uppercase mb-6 text-gray-400">Join the Community</h3>
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-3 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 text-white rounded-xl px-5 py-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(88,101,242,0.3)] w-full sm:w-auto"
            >
              <img src="/discord.png" alt="Discord" className="w-6 h-6 object-contain drop-shadow-md" />
              <span className="text-sm font-semibold tracking-wide text-[#5865F2]">Discord</span>
            </a>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Join our server for exclusive drops, support, and giveaways.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium tracking-wide text-gray-500">
            &copy; {new Date().getFullYear()} LarpSense Store. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse"></span>
            Not affiliated with Valve Corporation.
          </div>
        </div>
      </div>
    </footer>
  );
}
