"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { createClient } from "@supabase/supabase-js";

// Initialize supabase client for polling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface CryptoPaymentModalProps {
  payAddress: string;
  payAmount: string | number;
  trackId: string; // The OxaPay track ID
  onClose: () => void;
  onSuccess: () => void;
}

export function CryptoPaymentModal({ payAddress, payAmount, trackId, onClose, onSuccess }: CryptoPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [isPaid, setIsPaid] = useState(false);

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
        
        if (data.status === 'Paid' || data.status === 'Completed') {
          setIsPaid(true);
          clearInterval(pollInterval);
        } else if (data.status === 'Expired' || data.status === 'Failed') {
          // Could handle failure here
          clearInterval(pollInterval);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(payAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative text-center">
        
        {isPaid ? (
          <div className="py-8">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Completed!</h2>
            <p className="text-neutral-400 mb-6">Your items have been delivered to your profile.</p>
            <button onClick={onSuccess} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors">
              Continue
            </button>
          </div>
        ) : (
          <>
            <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Awaiting Payment</h2>
            <p className="text-sm text-neutral-400 mb-6">Send the exact amount to the address below.</p>

            <div className="bg-white p-4 rounded-xl inline-block mb-6">
              <QRCode value={payAddress} size={200} />
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-400">Amount</span>
                <span className="text-lg font-bold text-white">{payAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400">Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-300 truncate max-w-[150px] font-mono">{payAddress}</span>
                  <button onClick={handleCopy} className="text-blue-500 hover:text-blue-400 text-xs font-medium">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-8">
              <span className="text-neutral-400">Time remaining</span>
              <span className="font-mono text-amber-500 font-bold">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>

            <div className="w-full bg-white/5 border border-white/10 text-white font-medium py-4 rounded-xl flex flex-col items-center justify-center gap-3">
              <svg className="w-6 h-6 animate-spin text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-400">Waiting for network confirmation...</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
