"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, Bitcoin, ChevronRight, CheckCircle2, QrCode, Smartphone, Loader2, ShieldAlert, ChevronDown, CircleDollarSign } from "lucide-react";
import { SiStripe, SiSolana, SiLitecoin, SiTether, SiBitcoin, SiEthereum } from "react-icons/si";
import { supabase } from "@/lib/supabase-client";
import { CryptoPaymentModal } from "@/components/dashboard/CryptoPaymentModal";
import { useCurrency } from "@/lib/CurrencyContext";
import CornerWeb from "@/components/halloween/CornerWeb";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

type PaymentMethod = 'card' | 'crypto';
const getPresets = (currency: string, rate: number) => {
  // Hardcoded nice overrides for some major currencies
  if (currency === 'PLN') return [50, 100, 250, 500];
  if (currency === 'EUR' || currency === 'USD' || currency === 'GBP' || currency === 'CHF') return [10, 25, 50, 100];
  
  // Dynamic scaling for other currencies based on exchange rate!
  // We want to roughly match 10, 25, 50, 100 EUR in value.
  const basePresets = [10, 25, 50, 100];
  
  return basePresets.map(base => {
    const rawValue = base * rate;
    
    // Rounding logic based on magnitude
    if (rawValue < 20) return Math.ceil(rawValue);
    if (rawValue < 100) return Math.ceil(rawValue / 5) * 5;     // Round to nearest 5 (e.g. 43 -> 45)
    if (rawValue < 1000) return Math.ceil(rawValue / 50) * 50;  // Round to nearest 50 (e.g. 430 -> 450)
    if (rawValue < 10000) return Math.ceil(rawValue / 500) * 500; // Round to nearest 500
    return Math.ceil(rawValue / 1000) * 1000;
  });
};

export default function TopUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<number>(10);
  const [rawAmount, setRawAmount] = useState<string>('10');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isCryptoExpanded, setIsCryptoExpanded] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing secure connection...");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({ stripe_enabled: true, crypto_enabled: true });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{ payAddress: string, payAmount: string | number, trackId: string, orderId?: string } | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [promoCodeError, setPromoCodeError] = useState("");
  const [promoCodeSuccess, setPromoCodeSuccess] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const { convert, currency, convertFromLocal, isSuffix } = useCurrency();
  const rate = convertFromLocal(1) ? 1 / convertFromLocal(1) : 1; // get actual rate
  const presets = getPresets(currency, rate);
  const minLocalDeposit = convert(2).amount;
  const currentSymbol = convert(0).symbol;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings({ stripe_enabled: data.stripe_enabled ?? true, crypto_enabled: data.crypto_enabled ?? true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSettings(false);
      }
    };

    const handleOpen = () => {
      setIsOpen(true);
      setStep(1);
      const initialPreset = getPresets(currency, rate)[0] || 10;
      setAmount(initialPreset);
      setRawAmount(String(initialPreset));
      setMethod(null);
      setSelectedCryptoCoin(null);
      setIsCryptoExpanded(false);
      setErrorMsg(null);
      setPromoCode("");
      setDiscountPct(0);
      setPromoCodeError("");
      setPromoCodeSuccess("");
      fetchSettings();
    };
    window.addEventListener('open-topup', handleOpen);
    return () => window.removeEventListener('open-topup', handleOpen);
  }, []);

  if (!isOpen) return null;

  const getFeeMultiplier = () => {
    switch (method) {
      case 'card': return 0.015; // 1.5%
      case 'crypto': return 0.000; // 0%
      default: return 0;
    }
  };

  const getFixedFeeLocal = () => {
    switch (method) {
      case 'card': return convert(0.25).amount;
      case 'crypto': return 0.00;
      default: return 0;
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoCodeError("");
    setPromoCodeSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         setPromoCodeError("You must be logged in.");
         return;
      }
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoCode.trim(), userId: session.user.id })
      });
      const data = await res.json();
      if (data.ok) {
        setDiscountPct(data.discountPct);
        setPromoCodeSuccess(`Promo code applied! +${data.discountPct}% bonus added to your top-up.`);
        if (data.code) {
          setPromoCode(data.code);
        }
      } else {
        setPromoCodeError(data.error || "Invalid promo code");
        setDiscountPct(0);
      }
    } catch (err) {
      setPromoCodeError("Error validating code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const costAmount = amount;
  const bonusAmount = amount > 0 ? Number((amount * (discountPct / 100)).toFixed(2)) : 0;
  const cardFee = costAmount > 0 ? Number((costAmount * getFeeMultiplier() + getFixedFeeLocal()).toFixed(2)) : 0;
  const total = (costAmount + cardFee).toFixed(2);

  const startPaymentSimulation = async () => {
    const amountInEur = convertFromLocal(amount);
    if (amountInEur < 2) return;
    if (!method) {
      setErrorMsg("Please select a payment method");
      return;
    }
    setErrorMsg(null);
    
    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMsg("You must be logged in to top up!");
      return;
    }
    
    if (method === 'crypto' && !selectedCryptoCoin) {
      setErrorMsg("Please select a cryptocurrency.");
      return;
    }

    setStep(2);
    setLoadingText("Initializing Secure Gateway...");

    try {
      if (method === 'crypto') {
        const res = await fetch("/api/create-oxapay-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            token: session.access_token,
            amount: amountInEur,
            type: "topup",
            currency: selectedCryptoCoin,
            promoCode: promoCode.trim() || undefined
          })
        });

        const data = await res.json();
        if (data.payAddress) {
          setCryptoPaymentData(data);
          // Don't close TopUpModal immediately, let the overlay happen
        } else {
          setErrorMsg("Failed to initialize crypto payment: " + (data.error || "Unknown error"));
          setStep(1);
        }
      } else {
        // Card (Stripe)
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            token: session.access_token,
            amount: amountInEur,
            paymentMethod: 'stripe',
            currency: currency,
            promoCode: promoCode.trim() || undefined
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
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/90" onClick={() => step !== 2 && setIsOpen(false)}></div>
      
      <div className={`bg-[#0a0a0a] ${HALLOWEEN_EVENT_ENABLED ? 'border border-orange-500/30' : 'border border-white/10'} rounded-[24px] w-full max-w-lg relative z-10 my-auto transition-all duration-500 overflow-hidden ${step === 2 ? 'scale-95' : 'scale-100'}`}>
        
        {/* Subtle Halloween Corner Web inside modal */}
        <CornerWeb className="w-24 h-24 opacity-40 -top-1 -right-1" />

        {/* Header */}
        <div className="p-6 md:p-8 pb-0 flex justify-between items-center relative z-20">
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>
              {step === 1 && "Top Up Balance"}
              {step === 2 && "Processing Payment"}
              {step === 3 && "Payment Successful"}
            </span>
            {step === 1 && <MiniPumpkin className="w-5 h-5 -mt-0.5" />}
          </h3>
          {step !== 2 && (
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative z-30">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 md:p-8 relative z-20">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Amount Selection */}
              <div className="space-y-3">
                <label className="block text-[13px] font-semibold text-[#f5f5f7]/60">Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => { setAmount(preset); setRawAmount(String(preset)); }}
                      disabled={(method === 'crypto' && selectedCryptoCoin === 'BTC' && convertFromLocal(preset) < 15)}
                      className={`py-3.5 flex flex-col items-center rounded-[12px] font-medium transition-all ${amount === preset ? 'bg-white text-black' : 'bg-[#1a1a1a] text-white/50 hover:bg-[#222] hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <span className="text-[15px]">{convert(convertFromLocal(preset)).formatted}</span>
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  {isSuffix ? (
                    <>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={rawAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (/^\d*\.?\d*$/.test(raw)) {
                            setRawAmount(raw);
                            const parsed = parseFloat(raw);
                            setAmount(isNaN(parsed) ? 0 : parsed);
                          }
                        }}
                        className={`w-full bg-[#1a1a1a] border-none rounded-[12px] py-4 pl-4 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-lg ${currentSymbol.length > 2 ? 'pr-16' : 'pr-12'}`}
                        placeholder="10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">{currentSymbol}</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">{currentSymbol}</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={rawAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (/^\d*\.?\d*$/.test(raw)) {
                            setRawAmount(raw);
                            const parsed = parseFloat(raw);
                            setAmount(isNaN(parsed) ? 0 : parsed);
                          }
                        }}
                        className={`w-full bg-[#1a1a1a] border-none rounded-[12px] py-4 pr-4 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-lg ${currentSymbol.length > 1 ? 'pl-12' : 'pl-10'}`}
                        placeholder="10"
                      />
                    </>
                  )}
                </div>
                <p className="text-[12px] text-white/40 font-medium mt-2">Minimum deposit: {convert(2).formatted}</p>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <label className="block text-[13px] font-semibold text-[#f5f5f7]/60">Payment Method</label>
                <div className="space-y-2 bg-[#1a1a1a] p-2 rounded-[16px]">
                  
                  {loadingSettings ? (
                    <>
                      <div className="w-full h-[64px] bg-white/5 rounded-[12px] animate-pulse"></div>
                      <div className="w-full h-[64px] bg-white/5 rounded-[12px] animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      {/* Card */}
                  <button 
                    onClick={() => settings.stripe_enabled && setMethod('card')} 
                    disabled={!settings.stripe_enabled}
                    className={`w-full flex items-center justify-between p-3 rounded-[12px] transition-all ${
                      !settings.stripe_enabled ? 'opacity-50 cursor-not-allowed grayscale' :
                      method === 'card' ? 'bg-[#2a2a2a]' : 'hover:bg-[#222]'
                    }`}
                  >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-[#635BFF]/10 text-[#635BFF] rounded-xl">
                          <SiStripe className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <div className={`font-semibold text-[14px] ${method === 'card' || settings.stripe_enabled ? 'text-white' : 'text-white/40'}`}>Debit / Credit Card</div>
                          <div className="text-[12px] text-white/40 mt-0.5">{!settings.stripe_enabled ? 'Temporarily disabled' : 'Apple Pay, Google Pay, Visa'} <span className="text-indigo-400 font-medium">{settings.stripe_enabled ? `(+${convert(0.25).formatted})` : ''}</span></div>
                        </div>
                      </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${method === 'card' ? 'bg-[#635BFF]' : 'border border-white/20'}`}>
                      {method === 'card' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>

                  {/* Crypto */}
                  <div className={`rounded-[12px] transition-all ${
                    !settings.crypto_enabled ? 'opacity-50 cursor-not-allowed grayscale' :
                    method === 'crypto' ? 'bg-[#2a2a2a]' : 'hover:bg-[#222]'
                  }`}>
                    <button 
                      onClick={() => { 
                        if (!settings.crypto_enabled) return;
                        setMethod('crypto');
                        setIsCryptoExpanded(!isCryptoExpanded);
                      }}
                      disabled={!settings.crypto_enabled}
                      className="w-full flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl">
                          <SiBitcoin className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className={`font-semibold text-[14px] ${method === 'crypto' || settings.crypto_enabled ? 'text-white' : 'text-white/40'}`}>Cryptocurrency</div>
                          <div className="text-[12px] text-white/40 mt-0.5">{!settings.crypto_enabled ? 'Temporarily disabled' : 'Pay via OxaPay'} <span className="text-amber-400 font-medium">{settings.crypto_enabled ? '(0% fee)' : ''}</span></div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${method === 'crypto' ? 'bg-amber-500' : 'border border-white/20'}`}>
                        {method === 'crypto' && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                      </div>
                    </button>
                    
                    {method === 'crypto' && (
                      <div className="w-full px-3 pb-3 animate-in slide-in-from-top-2">
                        <div className="relative mt-2">
                          <button
                            onClick={() => setIsCryptoExpanded(!isCryptoExpanded)}
                            className="w-full flex items-center justify-between p-3 rounded-[10px] bg-[#1a1a1a] text-white hover:bg-[#222] transition-colors border border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              {!selectedCryptoCoin ? (
                                <span className="text-white/40 text-[13px]">Select cryptocurrency...</span>
                              ) : (
                                <>
                                  {selectedCryptoCoin === 'BTC' && <SiBitcoin className="w-4 h-4 text-amber-500" />}
                                  {selectedCryptoCoin === 'ETH' && <SiEthereum className="w-4 h-4 text-indigo-400" />}
                                  {selectedCryptoCoin === 'USDT_TRC20' && <SiTether className="w-4 h-4 text-emerald-500" />}
                                  {selectedCryptoCoin === 'USDC_ERC20' && <CircleDollarSign className="w-4 h-4 text-blue-400" />}
                                  {selectedCryptoCoin === 'LTC' && <SiLitecoin className="w-4 h-4 text-blue-400" />}
                                  {selectedCryptoCoin === 'SOL' && <SiSolana className="w-4 h-4 text-purple-500" />}
                                  <span className="text-[13px] font-medium">
                                    {selectedCryptoCoin === 'USDT_TRC20' ? 'USDT' : selectedCryptoCoin === 'USDC_ERC20' ? 'USDC' : selectedCryptoCoin}
                                  </span>
                                  {selectedCryptoCoin === 'BTC' && (
                                    <span className="text-[10px] text-amber-500/80 font-medium ml-1">
                                      (Min. €15)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isCryptoExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isCryptoExpanded && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/5 rounded-[12px] overflow-y-auto overscroll-contain max-h-[200px] custom-scrollbar z-50 shadow-2xl">
                              {[
                                { id: 'BTC', label: 'Bitcoin (BTC)', icon: <SiBitcoin className="w-4 h-4 text-amber-500" /> },
                                { id: 'ETH', label: 'Ethereum (ETH)', icon: <SiEthereum className="w-4 h-4 text-indigo-400" /> },
                                { id: 'USDT_TRC20', label: 'Tether (USDT)', icon: <SiTether className="w-4 h-4 text-emerald-500" /> },
                                { id: 'USDC_ERC20', label: 'USD Coin (USDC)', icon: <CircleDollarSign className="w-4 h-4 text-blue-400" /> },
                                { id: 'LTC', label: 'Litecoin (LTC)', icon: <SiLitecoin className="w-4 h-4 text-blue-400" /> },
                                { id: 'SOL', label: 'Solana (SOL)', icon: <SiSolana className="w-4 h-4 text-purple-500" /> },
                              ].map((coin) => (
                                <button
                                  key={coin.id}
                                  onClick={() => { setSelectedCryptoCoin(coin.id); setIsCryptoExpanded(false); }}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                    {coin.icon}
                                  </div>
                                  <span className="text-[13px] font-medium text-white">
                                    {coin.label}
                                    {coin.id === 'BTC' && <span className="text-[10px] text-amber-500/80 ml-2">(Min. €15)</span>}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                  )}
                </div>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo Code (Optional)"
                    className="w-full bg-[#1a1a1a] border-none rounded-[10px] py-3 pl-4 text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-[13px]"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={isApplyingPromo || !promoCode.trim()}
                    className="px-5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-[10px] transition-colors disabled:opacity-50 text-[13px]"
                  >
                    {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {promoCodeSuccess && <p className="text-[11px] text-emerald-400 font-medium pl-1">{promoCodeSuccess}</p>}
                {promoCodeError && <p className="text-[11px] text-red-400 font-medium pl-1">{promoCodeError}</p>}
              </div>

              {/* Receipt & Action */}
              <div className="pt-2">
                {errorMsg && (
                  <div className="bg-red-500/10 rounded-[12px] p-4 mb-6 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-[13px] font-medium">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6 px-1">
                  <div className="flex justify-between text-white/50 text-[14px] font-medium">
                    <span>Deposit Amount</span>
                    <span className="text-white">{convert(convertFromLocal(amount > 0 ? amount : 0)).formatted}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-emerald-400 text-[14px] font-medium">
                      <span>Bonus (+{discountPct}%)</span>
                      <span>+{convert(convertFromLocal(bonusAmount)).formatted}</span>
                    </div>
                  )}
                  {cardFee > 0 && (
                    <div className="flex justify-between text-white/50 text-[14px] font-medium">
                      <span>Gateway Fee</span>
                      <span className="text-white/80">+{convert(convertFromLocal(cardFee)).formatted}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-4 mt-2 flex justify-between items-end">
                    <span className="font-semibold text-white/80 text-[15px]">Total to pay</span>
                    <span className="font-bold text-white text-[20px] leading-none">{convert(convertFromLocal(Number(total))).formatted}</span>
                  </div>
                </div>

                <button
                  onClick={startPaymentSimulation}
                  disabled={convertFromLocal(amount) < 2 || (method === 'crypto' && selectedCryptoCoin === 'BTC' && convertFromLocal(amount) < 15)}
                  className="w-full bg-white text-black font-semibold text-[15px] py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-white/5 border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {method === 'card' && <SiStripe className="w-10 h-10 text-white animate-pulse" />}
                    {method === 'crypto' && <QrCode className="w-8 h-8 text-white animate-pulse" />}
                  </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-white">Do not close this window</h4>
                <p className="text-sm font-medium text-white/50 animate-pulse">{loadingText}</p>
              </div>
            </div>
          )}

          {step === 2 && !cryptoPaymentData && (
            <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 z-10 text-center animate-in fade-in rounded-[24px]">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-t-2 border-white/80 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-white/20 rounded-full animate-spin-reverse"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white/60">
                  <QrCode className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-white">Do not close this window</h4>
                <p className="text-sm font-medium text-white/50 animate-pulse">{loadingText}</p>
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
                <p className="text-gray-400 font-medium">{convert(convertFromLocal(amount)).formatted} has been added to your balance.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
    
    {cryptoPaymentData && (
      <CryptoPaymentModal
        payAddress={cryptoPaymentData.payAddress}
        payAmount={cryptoPaymentData.payAmount}
        trackId={cryptoPaymentData.trackId}
        orderId={cryptoPaymentData.orderId}
        currency={selectedCryptoCoin || 'BTC'}
        fiatAmount={convertFromLocal(amount)}
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
