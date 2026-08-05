"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, Bitcoin, ChevronRight, CheckCircle2, QrCode, Smartphone, Loader2, ShieldAlert } from "lucide-react";
import { SiStripe, SiSolana, SiLitecoin, SiTether, SiBitcoin } from "react-icons/si";
import { supabase } from "@/lib/supabase-client";
import { CryptoPaymentModal } from "@/components/dashboard/CryptoPaymentModal";

type PaymentMethod = 'card' | 'crypto';
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
    
    {cryptoPaymentData && (
      <CryptoPaymentModal
        payAddress={cryptoPaymentData.payAddress}
        payAmount={cryptoPaymentData.payAmount}
        trackId={cryptoPaymentData.trackId}
        onClose={() => {
          setCryptoPaymentData(null);
          setStep(1); // Reset loader in TopUpModal
          setIsOpen(false); // Also close TopUpModal so user can freely click again
        }}
        onSuccess={() => {
          setCryptoPaymentData(null);
          setIsOpen(false);
          window.dispatchEvent(new Event('balance-updated'));
        }}
      />
    )}
    </>
  );
}
