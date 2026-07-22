"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export default function TopUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-topup', handleOpen);
    return () => window.removeEventListener('open-topup', handleOpen);
  }, []);

  if (!isOpen) return null;

  const cardFee = amount > 0 ? Number((amount * 0.05 + 0.29).toFixed(2)) : 0;
  const total = (amount + cardFee).toFixed(2);

  const handleTopUp = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to top up!");
        return;
      }

      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          amount: amount,
          token: session.access_token
        })
      });

      const data = await res.json();
      if (data.ok) {
        alert(`Successfully added €${amount.toFixed(2)} to your balance!`);
        window.dispatchEvent(new Event('balance-updated'));
        setIsOpen(false);
      } else {
        alert("Failed to top up: " + data.error);
      }
    } catch (err) {
      alert("Error processing top up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 md:p-8 w-full max-w-lg relative z-10 shadow-2xl">
        <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6">Top Up Balance</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-mono tracking-widest text-gray-400 uppercase mb-3">Amount to add</label>
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-mono">€</span>
              <input 
                type="number" 
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#181818] border border-white/5 rounded-xl py-4 pl-9 pr-12 text-white font-mono focus:outline-none focus:border-white/20 transition-all text-lg"
                placeholder="0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                <button 
                  onClick={() => setAmount(prev => Number((prev + 1).toFixed(2)))} 
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-500 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
                <button 
                  onClick={() => setAmount(prev => Math.max(0.50, Number((prev - 1).toFixed(2))))} 
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-500 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </div>
            </div>
            <p className="text-xs font-mono text-gray-500 mt-1">Minimum €0.50.</p>
          </div>

          <div>
            <label className="block text-xs font-mono tracking-widest text-gray-400 uppercase mb-3">Payment Method</label>
            <button
              className="w-full flex items-center justify-between p-4 bg-[#181818] border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#252530] flex items-center justify-center text-[#7C66FF]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">Stripe</div>
                  <div className="text-xs text-gray-400 mt-0.5">Credit Card, BLIK, etc.</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="bg-[#181818] border border-white/5 rounded-xl p-4 font-mono text-sm">
            <div className="flex justify-between text-gray-400 mb-2">
              <span>Added to balance</span>
              <span className="text-white">€{amount > 0 ? amount.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between text-gray-400 mb-4">
              <span>Card fee</span>
              <span className="text-white">+€{cardFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-center">
              <span className="font-bold text-white">You pay</span>
              <span className="font-bold text-white text-lg">€{total}</span>
            </div>
          </div>

          <button
            onClick={handleTopUp}
            disabled={loading || amount < 0.50}
            className="w-full bg-[#ededed] hover:bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 mt-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> : `Pay €${total} by card`}
          </button>
        </div>
      </div>
    </div>
  );
}
