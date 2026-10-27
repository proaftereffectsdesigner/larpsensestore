"use client";

import { usePathname, useRouter } from "next/navigation";

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  return (
    <main className="min-h-screen bg-[#050505] relative pt-24 pb-20">
      <div className="w-full mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black text-[#f5f5f7] tracking-tighter uppercase">
            Daily Rewards
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#0a0a0a] border border-[#262626] rounded-sm p-1 mb-12">
          <button 
            onClick={() => router.push('/rewards/case')}
            className={`px-8 py-3 rounded-sm font-bold text-sm tracking-widest uppercase transition-all ${
              pathname.includes('/case') ? 'bg-accent text-[#0a0a0a]' : 'text-[#737373] hover:text-[#f5f5f7]'
            }`}
          >
            Case
          </button>
          <button 
            onClick={() => router.push('/rewards/card')}
            className={`px-8 py-3 rounded-sm font-bold text-sm tracking-widest uppercase transition-all ${
              pathname.includes('/card') ? 'bg-accent text-[#0a0a0a]' : 'text-[#737373] hover:text-[#f5f5f7]'
            }`}
          >
            Card
          </button>
        </div>
      </div>
      
      {/* Children content (Case or Card) */}
      {children}
    </main>
  );
}
