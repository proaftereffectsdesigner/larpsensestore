"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { createClient } from "@supabase/supabase-js";
import { SiBitcoin, SiEthereum, SiTether, SiLitecoin, SiSolana } from "react-icons/si";
import { CircleDollarSign, CheckCircle2, Copy, AlertTriangle } from "lucide-react";

// Initialize supabase client for polling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface CryptoPaymentModalProps {
  payAddress: string;
  payAmount: string | number;
  trackId: string;
  orderId?: string;
  currency?: string;
  fiatAmount?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CryptoPaymentModal({ payAddress, payAmount, trackId, orderId, currency, fiatAmount, onClose, onSuccess }: CryptoPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isPaid, setIsPaid] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Waiting");

  useEffect(() => {
    // Basic countdown timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    // Automated API polling for transaction status
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/check-oxapay-tx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId })
        });
        const data = await res.json();
        
        const statusStr = String(data.status || "").toLowerCase();
        
        if (statusStr === 'paid' || statusStr === 'completed' || statusStr === 'finished') {
          setIsPaid(true);
          clearInterval(pollInterval);
        } else if (statusStr === 'expired' || statusStr === 'failed') {
          // Could handle failure here
          clearInterval(pollInterval);
        } else if (data.status) {
          // Update status text if it's confirming or waiting
          setPaymentStatus(data.status);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [trackId]);

  const handleClose = async () => {
    if (orderId && !isPaid) {
      try {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      } catch (e) {
        console.error("Failed to cancel order", e);
      }
    }
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getCoinDetails = (coinId: string | undefined) => {
    switch (coinId) {
      case 'BTC': return { name: 'Bitcoin', network: 'Bitcoin', icon: <SiBitcoin className="w-5 h-5 text-amber-500" /> };
      case 'ETH': return { name: 'Ethereum', network: 'ERC20', icon: <SiEthereum className="w-5 h-5 text-indigo-400" /> };
      case 'USDT_TRC20': return { name: 'Tether', network: 'TRC20', icon: <SiTether className="w-5 h-5 text-emerald-500" /> };
      case 'USDC_ERC20': return { name: 'USD Coin', network: 'ERC20', icon: <CircleDollarSign className="w-5 h-5 text-blue-400" /> };
      case 'LTC': return { name: 'Litecoin', network: 'Litecoin', icon: <SiLitecoin className="w-5 h-5 text-blue-400" /> };
      case 'SOL': return { name: 'Solana', network: 'Solana', icon: <SiSolana className="w-5 h-5 text-purple-500" /> };
      default: return { name: 'Cryptocurrency', network: 'its native', icon: <CircleDollarSign className="w-5 h-5 text-white" /> };
    }
  };

  const coin = getCoinDetails(currency);
  const displayCurrency = currency === 'USDT_TRC20' ? 'USDT' : currency === 'USDC_ERC20' ? 'USDC' : currency;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col my-auto">
        
        {/* Glow effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-accent/20 blur-[60px] pointer-events-none rounded-full" />

        {isPaid ? (
          <div className="p-8 py-16 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Payment Completed!</h2>
            <p className="text-neutral-400 mb-8 font-medium">Your payment has been processed successfully.</p>
            <button onClick={onSuccess} className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-2 text-center relative z-10 border-b border-white/5">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-bold mb-4">
                {coin.icon} <span>{coin.name}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-accent font-bold mb-8 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {String(paymentStatus).toLowerCase().includes("confirm") 
                  ? paymentStatus 
                  : String(paymentStatus).toLowerCase().includes("paid")
                    ? "Payment Verified"
                    : "Awaiting payment"}
              </div>

              <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">Send Exactly</div>
              <div className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-2">
                {payAmount} <span className="text-xl text-gray-500 font-bold">{displayCurrency}</span>
              </div>
              {fiatAmount && (
                <div className="text-sm font-medium text-gray-500 mb-6">
                  ≈ €{fiatAmount.toFixed(2)}
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="p-6 flex flex-col items-center bg-[#0f0f0f] relative z-10 border-b border-white/5">
              <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 ring-4 ring-white/5">
                <QRCode value={payAddress} size={160} />
              </div>

              <div className="w-full text-center">
                <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">To this address</div>
                <button 
                  onClick={handleCopy}
                  className="w-full bg-[#161616] border border-white/5 hover:border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all"
                >
                  <span className="font-mono text-xs text-gray-300 truncate mr-3 group-hover:text-white transition-colors">{payAddress}</span>
                  <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-accent">
                    {copied ? (
                      <>Copied! <CheckCircle2 className="w-3 h-3" /></>
                    ) : (
                      <>Copy <Copy className="w-3 h-3" /></>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Warning & Footer */}
            <div className="p-6 bg-[#0a0a0a] relative z-10">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-200/70 leading-relaxed">
                  Send only over the <strong className="text-amber-500">{coin.network}</strong> network. Coins sent on another network can't be recovered.
                </p>
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>
                  Expires in <span className="text-white font-mono">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                </div>
                <button onClick={handleClose} className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                {(() => {
                  const normalized = String(paymentStatus).toLowerCase();
                  const step = (normalized.includes('paid') || normalized.includes('completed') || normalized.includes('finished')) ? 3 :
                               normalized.includes('confirm') ? 2 : 1;
                  
                  return (
                    <>
                      <div className={`flex items-center gap-1.5 transition-colors ${step === 1 ? 'text-accent' : 'text-neutral-600'}`}>
                        {step === 1 && <div className="w-3 h-3 rounded-full border-[1.5px] border-accent border-t-transparent animate-spin" />}
                        Waiting
                      </div>
                      <div className="text-neutral-800">-</div>
                      <div className={`flex items-center gap-1.5 transition-colors ${step === 2 ? 'text-accent' : 'text-neutral-600'}`}>
                        {step === 2 && <div className="w-3 h-3 rounded-full border-[1.5px] border-accent border-t-transparent animate-spin" />}
                        {step === 2 && paymentStatus.includes('/') ? paymentStatus : 'Confirming'}
                      </div>
                      <div className="text-neutral-800">-</div>
                      <div className={`flex items-center gap-1.5 transition-colors ${step === 3 ? 'text-accent' : 'text-neutral-600'}`}>
                        Paid
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
