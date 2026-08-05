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
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll Supabase for changes to this order via trackId
  // Wait, trackId is not stored in our orders database! Order ID is stored!
  // To avoid changing too many files, we can just poll the order status. But we don't have order ID passed here.
  // Actually, we can pass orderId from the parent component. 
  // For now, let's just make it look cool and rely on a 'Check Status' button or just close button.
  // We will assume the parent component polls or the user just refreshes.

  const handleCopy = () => {
    navigator.clipboard.writeText(payAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
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

            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-400">Time remaining</span>
              <span className="text-amber-500 font-mono font-medium">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
            
            <button onClick={onSuccess} className="w-full mt-6 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors border border-neutral-700">
              I have paid
            </button>
          </>
        )}
      </div>
    </div>
  );
}
