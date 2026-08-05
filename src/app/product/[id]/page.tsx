"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, ChevronRight, Minus, Plus, ShieldCheck, ShieldAlert, AlertCircle, ShoppingBag, CircleDollarSign } from "lucide-react";
import { SiStripe, SiSolana, SiLitecoin, SiTether, SiBitcoin, SiEthereum } from "react-icons/si";
import { CryptoPaymentModal } from "@/components/dashboard/CryptoPaymentModal";
import { toast } from "sonner";


export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const getStockColor = (stockAmount: number | null) => {
    if (stockAmount === null) return "text-gray-500";
    if (stockAmount === 0) return "text-red-400";
    if (stockAmount >= 100) return "text-green-400";
    if (stockAmount >= 50) return "text-yellow-400";
    return "text-orange-400";
  };
  const product = products.find((p) => p.id === id);

  const [stock, setStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"polar" | "crypto" | "balance">("polar");
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCryptoCoinDropdownOpen, setIsCryptoCoinDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const paymentButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({ stripe_enabled: true, crypto_enabled: true });
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{ payAddress: string, payAmount: string | number, trackId: string, orderId?: string } | null>(null);

  // Recalculate dropdown position whenever it opens or window resizes
  const updateDropdownPos = useCallback(() => {
    if (paymentButtonRef.current) {
      const rect = paymentButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
    }
    return () => {
      window.removeEventListener('resize', updateDropdownPos);
      window.removeEventListener('scroll', updateDropdownPos, true);
    };
  }, [isDropdownOpen, updateDropdownPos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

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
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!product) return;
    
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock && data.stock.cs2) {
          const available = data.stock.cs2[product.type]?.available || 0;
          setStock(available);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStock(false));

    // Track checkout session started
    const sessionId = localStorage.getItem("analytics_session_id") || crypto.randomUUID();
    if (!localStorage.getItem("analytics_session_id")) {
      localStorage.setItem("analytics_session_id", sessionId);
    }

    supabase.from("checkout_sessions").insert({
      session_id: sessionId,
      product_type: product.type,
      status: 'started'
    }).then(({ data, error }) => {
       if (error) console.error("Failed to track checkout session", error);
    });

  }, [product]);

  if (!product) {
    return <div className="p-20 text-center text-white">Product not found</div>;
  }

  const handleQuantityChange = (delta: number) => {
    if (loadingStock || stock === 0) return;
    const max = Math.min(100, stock || 100);
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= max) {
      setQuantity(newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const totalPrice = product.price * quantity;

    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (paymentMethod === "crypto") {
        if (paymentMethod === 'crypto' && !selectedCryptoCoin) {
          toast.error("Please select a cryptocurrency.");
          setLoadingCheckout(false);
          return;
        }

        const res = await fetch("/api/create-oxapay-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            token,
            amount: totalPrice,
            type: "product_checkout",
            productId: product.id,
            quantity: quantity,
            currency: selectedCryptoCoin
          })
        });
        const data = await res.json();
        if (data.payAddress) {
          setCryptoPaymentData(data);
        } else {
          toast.error("Crypto Checkout failed: " + (data.error || "Unknown error"));
        }
        setLoadingCheckout(false);
      } else {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            productId: product.id, 
            quantity, 
            userId: user.id,
            token,
            paymentMethod
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.dispatchEvent(new Event('balance-updated'));
          router.push(data.url);
        } else {
          toast.error("Checkout failed: " + data.error);
          setLoadingCheckout(false);
        }
      }
    } catch (err) {
      toast.error("Error initiating checkout");
      setLoadingCheckout(false);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <>
    <div className="flex justify-center items-center py-12 px-4 relative z-10 min-h-[calc(100vh-80px)]">
      <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 w-full max-w-[min(420px,90vw)] shadow-2xl relative">
        
        {/* Cena i Tytuł */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1 flex justify-between items-center">
            <span>Price</span>
            <span className="text-accent flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {product.name}</span>
          </div>
          <div className="text-5xl font-medium text-white tracking-tight flex items-baseline gap-2">
            €{totalPrice.toFixed(2)}
            {quantity > 1 && <span className="text-sm text-gray-500 font-sans tracking-normal">(€{product.price.toFixed(2)} ea)</span>}
          </div>
        </div>

        {/* Sekcja Email */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Email for your order</div>
          <div className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-gray-300 text-sm">
            {authChecked ? (user?.email || "Not logged in") : "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-2 font-mono">
            {user ? "Saved to your account." : "Please log in to purchase."}
          </div>
        </div>

        {/* Sekcja Metoda Płatności */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Payment method</div>
          <div ref={paymentDropdownRef}>
            <button
              ref={paymentButtonRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:bg-[#222] transition-colors"
            >
              <div className="flex items-center gap-3">
                {paymentMethod === "polar" ? (
                  <div className="w-8 h-8 bg-gray-500/10 rounded-full flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                ) : paymentMethod === "crypto" ? (
                  <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <SiBitcoin className="w-4 h-4 text-amber-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div className="text-left">
                  <div className="font-bold text-sm text-white">
                    {paymentMethod === "polar" ? "Debit / Credit Card" : paymentMethod === "crypto" ? "Cryptocurrency" : "Balance"}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {paymentMethod === "polar" ? "Mastercard, Visa, Apple Pay etc. (3.5% + €0.30 fee)" : paymentMethod === "crypto" ? "Pay with any crypto via OxaPay (0.5% fee)" : "Pay with your NFA Store balance"}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div
                className="fixed bg-[#1c1c1c] border border-white/10 rounded-xl overflow-y-auto custom-scrollbar z-[9999] shadow-2xl"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  maxHeight: `calc(100vh - ${dropdownPos.top + 16}px)`,
                }}
                onWheel={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
              >
                <div className="p-2 space-y-1">
                {loadingSettings ? (
                  <>
                    <div className="w-full h-[56px] bg-white/5 rounded-xl animate-pulse"></div>
                    <div className="w-full h-[56px] bg-white/5 rounded-xl animate-pulse"></div>
                  </>
                ) : (
                  <>
                <button 
                  onClick={() => { if (settings.stripe_enabled) { setPaymentMethod("polar"); setIsDropdownOpen(false); } }}
                  disabled={!settings.stripe_enabled}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${!settings.stripe_enabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/10 rounded-full shrink-0">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm text-white">Credit Card / Apple Pay</div>
                    <div className="text-xs text-gray-500">{!settings.stripe_enabled ? 'Temporarily disabled' : 'Mastercard, Visa etc. (3.5% + €0.30 fee)'}</div>
                  </div>
                </button>
                <button 
                  onClick={() => { if (settings.crypto_enabled) { setPaymentMethod("crypto"); setIsDropdownOpen(false); } }}
                  disabled={!settings.crypto_enabled}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${!settings.crypto_enabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-amber-500/10 rounded-full shrink-0">
                      <SiBitcoin className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white">Cryptocurrency</div>
                      <div className="text-xs text-gray-500">{!settings.crypto_enabled ? 'Temporarily disabled' : 'Pay via OxaPay'} <span className="text-amber-400">{!settings.crypto_enabled ? '' : '(0.5% fee)'}</span></div>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => { setPaymentMethod("balance"); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/10 rounded-full">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-white">Balance</div>
                    <div className="text-xs text-gray-500">Pay with your NFA Store balance <span className="text-emerald-400 font-bold">(Instant)</span></div>
                  </div>
                </button>
                  </>
                )}
                </div>
              </div>
            )}</div>
        </div>
        
        {/* Sekcja Wyboru Krypto */}
        {paymentMethod === 'crypto' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[14px] font-bold text-white mb-2">Select Cryptocurrency</label>
            <div className="relative">
              <button
                onClick={() => setIsCryptoCoinDropdownOpen(!isCryptoCoinDropdownOpen)}
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
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCryptoCoinDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCryptoCoinDropdownOpen && (
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
                      onClick={() => { setSelectedCryptoCoin(coin.id); setIsCryptoCoinDropdownOpen(false); }}
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

        {/* Sekcja Ilości */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-[14px] font-bold text-white flex flex-col">
            Quantity
            <span className={`text-[10px] uppercase tracking-widest mt-1 ${getStockColor(stock)}`}>
              {loadingStock ? "Checking..." : stock === 0 ? "Out of stock" : `${stock} In Stock`}
            </span>
          </div>
          <div className="flex items-center bg-[#1c1c1c] border border-white/5 rounded-xl overflow-hidden">
            <button 
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || loadingStock || stock === 0}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-12 h-10 flex items-center justify-center text-white font-mono text-sm border-x border-white/5">
              {quantity}
            </div>
            <button 
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= Math.min(100, stock || 100) || loadingStock || stock === 0}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Przycisk Płatności */}
        {authChecked && !user ? (
          <button 
            onClick={() => router.push("/login")}
            className="w-full bg-[#eeeeee] text-black font-semibold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            Sign in to pay
          </button>
        ) : (
          <button 
            onClick={handleCheckout}
            disabled={loadingCheckout || loadingStock || stock === 0 || (paymentMethod === 'crypto' && selectedCryptoCoin === 'BTC' && totalPrice < 15)}
            className="w-full bg-[#eeeeee] text-black font-semibold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCheckout ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              `Pay €${totalPrice.toFixed(2)} with ${paymentMethod === "polar" ? "Card" : "Balance"}`
            )}
          </button>
        )}

        {/* Stopka */}
        <div className="mt-6 text-center text-xs text-gray-500 font-mono leading-relaxed">
          You finish on the next page.<br/>
          Your order is saved to your email.
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
        fiatAmount={totalPrice}
        onClose={() => setCryptoPaymentData(null)}
        onSuccess={() => {
          setCryptoPaymentData(null);
          router.push(`/dashboard/orders/${cryptoPaymentData.orderId}`);
        }}
      />
    )}
    </>
  );
}
