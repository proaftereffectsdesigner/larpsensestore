"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, Bitcoin, ChevronRight, CheckCircle2, QrCode, Smartphone, Loader2, ShieldAlert } from "lucide-react";
import { SiStripe } from "react-icons/si";
import { supabase } from "@/lib/supabase-client";

type PaymentMethod = 'card' | 'crypto';
const PRESETS = [10, 25, 50, 100];

export default function TopUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<number>(10);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing secure connection...");

  const CRYPTO_COINS = [
    { id: 'USDT_TRX', name: 'USDT (Tron)', icon: '₮', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'LTC', name: 'Litecoin', icon: 'Ł', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'SOL', name: 'Solana', icon: '◎', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'BTC', name: 'Bitcoin', icon: '₿', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setStep(1);
      setAmount(10);
      setMethod('card');
      setErrorMsg(null);
    };
    window.addEventListener('open-topup', handleOpen);
    return () => window.removeEventListener('open-topup', handleOpen);
  }, []);

  if (!isOpen) return null;

  const getFeeMultiplier = () => {
    switch (method) {
      case 'card': return 0.015; // 1.5%
      case 'crypto': return 0.005; // 0.5%
    }
  };

  const getFixedFee = () => {
    switch (method) {
      case 'card': return 0.25;
      case 'crypto': return 0.00;
    }
  };

  const cardFee = amount > 0 ? Number((amount * getFeeMultiplier() + getFixedFee()).toFixed(2)) : 0;
  const total = (amount + cardFee).toFixed(2);

  const startPaymentSimulation = async () => {
    if (amount < 0.5) return;
    setErrorMsg(null);
    
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg("You must be logged in to top up!");
      return;
    }

    setStep(2);
    setLoadingText("Initializing Secure Gateway...");

    try {
      if (method === 'crypto') {
        if (amount < 10) {
          setErrorMsg("Minimum amount for cryptocurrency is €10.00");
          setStep(1);
          return;
        }
        if (!selectedCryptoCoin) {
          setErrorMsg("Please select a cryptocurrency");
          setStep(1);
          return;
        }

        const res = await fetch("/api/create-plisio-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            token: session.access_token,
            amount: amount,
            currency: selectedCryptoCoin,
            type: "topup"
          })
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg("Failed to initialize crypto payment: " + (data.error || "Unknown error"));
          setStep(1);
        }
      } else {
        // Stripe Card
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            token: session.access_token,
            amount: amount,
            paymentMethod: method,
          })
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg("Failed to initialize payment: " + (data.error || "Unknown error"));
          setStep(1);
        }
      }
    } catch (err) {
      setErrorMsg("Error contacting payment gateway.");
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => step !== 2 && setIsOpen(false)}></div>
      
      <div className={`bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 ${step === 2 ? 'scale-95' : 'scale-100'}`}>
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-0 flex justify-between items-center relative z-20">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {step === 1 && "Top Up Balance"}
            {step === 2 && "Processing Payment"}
            {step === 3 && "Payment Successful"}
          </h3>
          {step !== 2 && (
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 md:p-8 relative z-20">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Amount Selection */}
              <div className="space-y-4">
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`py-3 rounded-xl font-bold transition-all ${amount === preset ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      €{preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">€</span>
                  <input 
                    type="number" 
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white font-bold focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-lg shadow-inner"
                    placeholder="Custom amount"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Payment Method</label>
                <div className="space-y-2">
                  
                  {/* Card */}
                  <button onClick={() => setMethod('card')} className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all ${method === 'card' ? 'bg-white/10 border-white/20' : 'bg-[#141414] border-white/5 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-[#635BFF]/10 rounded-xl">
                        <SiStripe className="w-5 h-5 text-[#635BFF]" />
                      </div>
                      <div className="text-left">
                        <div className={`font-bold text-sm ${method === 'card' ? 'text-white' : 'text-gray-300'}`}>Debit / Credit Card</div>
                        <div className="text-[11px] text-gray-500 font-medium">Mastercard, Visa, Apple Pay etc. via Stripe <span className="text-indigo-400 font-bold">(1.5% + €0.25 fee)</span></div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'card' ? 'border-[#635BFF]' : 'border-gray-600'}`}>
                      {method === 'card' && <div className="w-2.5 h-2.5 bg-[#635BFF] rounded-full"></div>}
                    </div>
                  </button>

                  {/* Crypto */}
                  <div className={`border rounded-2xl transition-all overflow-hidden ${method === 'crypto' ? 'bg-white/5 border-white/20' : 'bg-[#141414] border-white/5 hover:bg-white/5'}`}>
                    <button onClick={() => { setMethod('crypto'); if (!selectedCryptoCoin) setSelectedCryptoCoin(CRYPTO_COINS[0].id); }} className="w-full flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-500/10 rounded-xl">
                          <Bitcoin className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <div className={`font-bold text-sm ${method === 'crypto' ? 'text-white' : 'text-gray-300'}`}>Cryptocurrency</div>
                          <div className="text-[11px] text-gray-500 font-medium">BTC, ETH, LTC, USDT, SOL <span className="text-amber-400 font-bold">(0.5% fee)</span></div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'crypto' ? 'border-amber-400' : 'border-gray-600'}`}>
                        {method === 'crypto' && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>}
                      </div>
                    </button>
                    
                    {method === 'crypto' && (
                      <div className="p-4 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-3 mt-3">Select Currency</div>
                        <div className="grid grid-cols-2 gap-2">
                          {CRYPTO_COINS.map(coin => (
                            <button
                              key={coin.id}
                              onClick={() => setSelectedCryptoCoin(coin.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${selectedCryptoCoin === coin.id ? 'bg-white/10 border border-white/20 shadow-inner' : 'bg-[#0a0a0a] border border-white/5 hover:bg-white/5'}`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${coin.bg} ${coin.color}`}>
                                {coin.icon}
                              </div>
                              <span className={`text-sm font-bold ${selectedCryptoCoin === coin.id ? 'text-white' : 'text-gray-400'}`}>{coin.name}</span>
                            </button>
                          ))}
                        </div>
                        {amount < 10 && (
                          <div className="mt-4 text-xs font-medium text-amber-400/90 bg-amber-400/10 p-3 rounded-xl flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            Minimum amount for cryptocurrency is €10.00
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Receipt & Action */}
              <div>
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-500 font-bold text-sm">Action Failed</h4>
                      <p className="text-red-400 text-xs mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="bg-[#141414] rounded-2xl p-5 mb-4">
                  <div className="flex justify-between text-gray-400 text-sm font-medium mb-3">
                    <span>Deposit Amount</span>
                    <span className="text-white">€{amount > 0 ? amount.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm font-medium mb-4">
                    <span>Gateway Fee</span>
                    <span className="text-red-400">+€{cardFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-white/10 pt-4 flex justify-between items-end">
                    <span className="font-bold text-gray-300 uppercase tracking-widest text-xs">Total to pay</span>
                    <span className="font-black text-white text-2xl">€{total}</span>
                  </div>
                </div>

                <button
                  onClick={startPaymentSimulation}
                  disabled={amount < 0.50}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  Confirm Payment <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-white/5 border-t-accent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {method === 'card' && <CreditCard className="w-8 h-8 text-accent animate-pulse" />}
                  {method === 'crypto' && <QrCode className="w-8 h-8 text-accent animate-pulse" />}
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-white">Do not close this window</h4>
                <p className="text-sm font-medium text-accent animate-pulse">{loadingText}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-2xl font-black text-white">Success!</h4>
                <p className="text-gray-400 font-medium">€{amount.toFixed(2)} has been added to your balance.</p>
              </div>
            </div>
          )}
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        {method === 'crypto' && <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F7931A]/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 transition-opacity duration-1000"></div>}
      </div>
    </div>
  );
}
