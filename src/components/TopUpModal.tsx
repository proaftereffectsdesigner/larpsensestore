"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Wallet, Bitcoin, ChevronRight, CheckCircle2, QrCode, Smartphone, Loader2, ShieldAlert, ChevronDown, CircleDollarSign } from "lucide-react";
import { SiStripe, SiSolana, SiLitecoin, SiTether, SiBitcoin, SiEthereum } from "react-icons/si";
import { supabase } from "@/lib/supabase-client";
import { CryptoPaymentModal } from "@/components/dashboard/CryptoPaymentModal";
import { useCurrency } from "@/lib/CurrencyContext";

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => step !== 2 && setIsOpen(false)}></div>
      
      <div className={`bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] my-auto transition-all duration-500 ${step === 2 ? 'scale-95' : 'scale-100'}`}>
        
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
                  {presets.map(preset => (
                    <button
                      key={preset}
                    onClick={() => { setAmount(preset); setRawAmount(String(preset)); }}
                      disabled={(method === 'crypto' && selectedCryptoCoin === 'BTC' && convertFromLocal(preset) < 15)}
                      className={`py-3 flex flex-col items-center rounded-xl font-bold transition-all ${amount === preset ? 'bg-accent text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <span className="text-lg">{convert(convertFromLocal(preset)).formatted}</span>
                    </button>
                  ))}
                </div>
                <div className="relative">
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
                        className={`w-full bg-[#141414] border border-white/10 rounded-xl py-4 pl-4 text-white font-bold focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-lg shadow-inner ${currentSymbol.length > 2 ? 'pr-16' : 'pr-12'}`}
                        placeholder="10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{currentSymbol}</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{currentSymbol}</span>
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
                        className={`w-full bg-[#141414] border border-white/10 rounded-xl py-4 pr-4 text-white font-bold focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-lg shadow-inner ${currentSymbol.length > 1 ? 'pl-12' : 'pl-10'}`}
                        placeholder="10"
                      />
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-medium pl-1">Minimum deposit: <span className="text-gray-500">{convert(2).formatted}</span>.</p>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Payment Method</label>
                <div className="space-y-2">
                  
                  {loadingSettings ? (
                    <>
                      <div className="w-full h-[74px] bg-[#141414] border border-white/5 rounded-2xl animate-pulse"></div>
                      <div className="w-full h-[74px] bg-[#141414] border border-white/5 rounded-2xl animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      {/* Card */}
                  <button 
                    onClick={() => settings.stripe_enabled && setMethod('card')} 
                    disabled={!settings.stripe_enabled}
                    className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all ${
                      !settings.stripe_enabled ? 'opacity-50 cursor-not-allowed bg-[#141414] border-white/5 grayscale' :
                      method === 'card' ? 'bg-white/10 border-white/20' : 'bg-[#141414] border-white/5 hover:bg-white/5'
                    }`}
                  >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-[#635BFF]/10 rounded-xl">
                          <SiStripe className="w-6 h-6 text-[#635BFF]" />
                        </div>
                        <div className="text-left">
                          <div className={`font-bold text-sm ${method === 'card' ? 'text-white' : settings.stripe_enabled ? 'text-white' : 'text-gray-400'}`}>Debit / Credit Card</div>
                          <div className="text-xs text-gray-500">{!settings.stripe_enabled ? 'Temporarily disabled' : 'Mastercard, Visa, Apple Pay etc.'} <span className="text-indigo-400 font-bold">{settings.stripe_enabled ? `(1.5% + ${convert(0.25).formatted} fee)` : ''}</span></div>
                        </div>
                      </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'card' ? 'border-[#635BFF]' : 'border-gray-600'}`}>
                      {method === 'card' && <div className="w-2.5 h-2.5 bg-[#635BFF] rounded-full"></div>}
                    </div>
                  </button>

                  {/* Crypto */}
                  <div className={`border rounded-2xl transition-all ${
                    !settings.crypto_enabled ? 'opacity-50 cursor-not-allowed bg-[#141414] border-white/5 grayscale' :
                    method === 'crypto' ? 'bg-white/5 border-white/20' : 'bg-[#141414] border-white/5 hover:bg-white/5'
                  }`}>
                    <button 
                      onClick={() => { 
                        if (!settings.crypto_enabled) return;
                        setMethod('crypto');
                        setIsCryptoExpanded(!isCryptoExpanded);
                      }}
                      disabled={!settings.crypto_enabled}
                      className="w-full flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-500/10 rounded-xl">
                          <SiBitcoin className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-left">
                          <div className={`font-bold text-sm ${method === 'crypto' ? 'text-white' : settings.crypto_enabled ? 'text-white' : 'text-gray-400'}`}>Cryptocurrency</div>
                          <div className="text-[11px] text-gray-500 font-medium">{!settings.crypto_enabled ? 'Temporarily disabled' : 'Pay via OxaPay'} <span className="text-amber-400 font-bold">{settings.crypto_enabled ? '(0% fee)' : ''}</span></div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'crypto' ? 'border-amber-400' : 'border-gray-600'}`}>
                        {method === 'crypto' && <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>}
                      </div>
                    </button>
                    
                    {method === 'crypto' && (
                      <div className="w-full p-4 pt-0 animate-in slide-in-from-top-2">
                        <div className="relative">
                          <button
                            onClick={() => setIsCryptoExpanded(!isCryptoExpanded)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border bg-white/5 border-white/5 text-white hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {!selectedCryptoCoin ? (
                                <span className="text-gray-400 text-sm">Select cryptocurrency...</span>
                              ) : (
                                <>
                                  {selectedCryptoCoin === 'BTC' && <SiBitcoin className="w-4 h-4 text-amber-500" />}
                                  {selectedCryptoCoin === 'ETH' && <SiEthereum className="w-4 h-4 text-indigo-400" />}
                                  {selectedCryptoCoin === 'USDT_TRC20' && <SiTether className="w-4 h-4 text-emerald-500" />}
                                  {selectedCryptoCoin === 'USDC_ERC20' && <CircleDollarSign className="w-4 h-4 text-blue-400" />}
                                  {selectedCryptoCoin === 'LTC' && <SiLitecoin className="w-4 h-4 text-blue-400" />}
                                  {selectedCryptoCoin === 'SOL' && <SiSolana className="w-4 h-4 text-purple-500" />}
                                  <span className="text-sm font-bold">
                                    {selectedCryptoCoin === 'USDT_TRC20' ? 'USDT' : selectedCryptoCoin === 'USDC_ERC20' ? 'USDC' : selectedCryptoCoin}
                                  </span>
                                  {selectedCryptoCoin === 'BTC' && (
                                    <span className="text-[10px] text-amber-500/80 font-bold ml-1">
                                      (Min. €15)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCryptoExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isCryptoExpanded && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-xl overflow-y-auto max-h-[200px] custom-scrollbar z-50 shadow-2xl">
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
                                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    {coin.icon}
                                  </div>
                                  <span className="text-sm font-medium text-white">
                                    {coin.label}
                                    {coin.id === 'BTC' && <span className="text-[10px] text-amber-500/80 font-bold ml-2">(Min. €15)</span>}
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
              <div className="space-y-4">
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Promo Code (Optional)</label>
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-4 text-white font-bold focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm uppercase"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={isApplyingPromo || !promoCode.trim()}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {promoCodeSuccess && <p className="text-xs text-emerald-400 font-bold">{promoCodeSuccess}</p>}
                {promoCodeError && <p className="text-xs text-red-400 font-bold">{promoCodeError}</p>}
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
                    <span className="text-white block">{convert(convertFromLocal(amount > 0 ? amount : 0)).formatted}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-emerald-400 text-sm font-medium mb-3">
                      <span>Bonus (+{discountPct}%)</span>
                      <span className="block">+{convert(convertFromLocal(bonusAmount)).formatted}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400 text-sm font-medium mb-4">
                    <span>Gateway Fee</span>
                    <span className="text-red-400 block">+{convert(convertFromLocal(cardFee)).formatted}</span>
                  </div>
                  <div className="border-t border-dashed border-white/10 pt-4 mb-3 flex justify-between items-end">
                    <span className="font-bold text-gray-300 uppercase tracking-widest text-xs">Total to pay</span>
                    <span className="font-black text-white text-2xl block">{convert(convertFromLocal(Number(total))).formatted}</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex justify-between items-center">
                    <span className="font-bold text-accent uppercase tracking-widest text-xs">You will receive</span>
                    <span className="font-black text-accent text-xl block">{convert(convertFromLocal(amount + bonusAmount)).formatted}</span>
                  </div>
                </div>

                <button
                  onClick={startPaymentSimulation}
                  disabled={convertFromLocal(amount) < 2 || (method === 'crypto' && selectedCryptoCoin === 'BTC' && convertFromLocal(amount) < 15)}
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
                    {method === 'card' && <SiStripe className="w-10 h-10 text-accent animate-pulse" />}
                    {method === 'crypto' && <QrCode className="w-8 h-8 text-accent animate-pulse" />}
                  </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-bold text-white">Do not close this window</h4>
                <p className="text-sm font-medium text-accent animate-pulse">{loadingText}</p>
              </div>
            </div>
          )}

          {step === 2 && !cryptoPaymentData && (
            <div className="absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10 text-center animate-in fade-in rounded-[24px]">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-2 border-accent/50 rounded-full animate-spin-reverse"></div>
                <div className="absolute inset-0 flex items-center justify-center text-accent">
                  <QrCode className="w-6 h-6 animate-pulse" />
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
                <p className="text-gray-400 font-medium">{convert(convertFromLocal(amount)).formatted} has been added to your balance.</p>
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
