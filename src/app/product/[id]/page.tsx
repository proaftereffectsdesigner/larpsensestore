"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, ChevronRight, Minus, Plus, ShieldCheck, Bitcoin, ShieldAlert } from "lucide-react";
import { SiStripe } from "react-icons/si";

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
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto" | "balance">("stripe");
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCryptoExpanded, setIsCryptoExpanded] = useState(false);

  const CRYPTO_COINS = [
    { id: 'USDT_TRX', name: 'USDT (Tron)', icon: '₮', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'LTC', name: 'Litecoin', icon: 'Ł', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'SOL', name: 'Solana', icon: '◎', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'BTC', name: 'Bitcoin', icon: '₿', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
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

    if (paymentMethod === "crypto") {
      if (!selectedCryptoCoin) {
        alert("Please select a cryptocurrency");
        return;
      }
    }

    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (paymentMethod === "crypto") {
        const res = await fetch("/api/create-plisio-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            token,
            amount: totalPrice,
            currency: selectedCryptoCoin,
            type: "product_checkout",
            productId: product.id,
            quantity: quantity
          })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Crypto Checkout failed: " + (data.error || "Unknown error"));
          setLoadingCheckout(false);
        }
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
          alert("Checkout failed: " + data.error);
          setLoadingCheckout(false);
        }
      }
    } catch (err) {
      alert("Error initiating checkout");
      setLoadingCheckout(false);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="flex justify-center items-center py-12 px-4 relative z-10 min-h-[calc(100vh-80px)]">
      <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 md:p-8 w-full max-w-[420px] shadow-2xl relative">
        
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
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:bg-[#222] transition-colors"
            >
              <div className="flex items-center gap-3">
                {paymentMethod === "stripe" ? (
                  <div className="w-8 h-8 bg-[#635BFF]/10 rounded-full flex items-center justify-center">
                    <SiStripe className="w-5 h-5 text-[#635BFF]" />
                  </div>
                ) : paymentMethod === "crypto" ? (
                  <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <Bitcoin className="w-4 h-4 text-amber-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {paymentMethod === "stripe" ? "Debit / Credit Card" : paymentMethod === "crypto" ? "Cryptocurrency" : "Balance"}
                  </div>
                  <div className="text-xs text-gray-500 truncate block mt-0.5">
                    {paymentMethod === "stripe" ? "Mastercard, Visa, Apple Pay etc. via Stripe (1.5% + €0.25 fee)" : paymentMethod === "crypto" ? (selectedCryptoCoin ? `${CRYPTO_COINS.find(c => c.id === selectedCryptoCoin)?.name} (0.5% fee)` : "BTC, ETH, LTC, USDT, SOL (0.5% fee)") : "Pay with your NFA Store balance"}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-xl overflow-y-auto z-20 shadow-xl max-h-[300px]">
                <button 
                  onClick={() => { setPaymentMethod("stripe"); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-[#635BFF]/10 rounded-full">
                    <SiStripe className="w-5 h-5 text-[#635BFF]" />
                  </div>
                  <div>
                    <div className="text-sm text-white">Debit / Credit Card</div>
                    <div className="text-xs text-gray-500">Mastercard, Visa, Apple Pay etc. via Stripe <span className="text-indigo-400">(1.5% + €0.25 fee)</span></div>
                  </div>
                </button>
                <button 
                  onClick={() => { 
                    if (paymentMethod === "crypto") {
                      setIsCryptoExpanded(!isCryptoExpanded);
                    } else {
                      setPaymentMethod("crypto"); 
                      setIsCryptoExpanded(true);
                      if (!selectedCryptoCoin) setSelectedCryptoCoin(CRYPTO_COINS[0].id); 
                    }
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors flex flex-col border-b border-white/5 ${paymentMethod === "crypto" ? 'bg-white/5' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-500/10 rounded-full">
                        <Bitcoin className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white">Cryptocurrency</div>
                        <div className="text-xs text-gray-500">BTC, ETH, LTC, USDT, SOL <span className="text-amber-400">(0.5% fee)</span></div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isCryptoExpanded && paymentMethod === 'crypto' ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                
                {paymentMethod === 'crypto' && isCryptoExpanded && (
                  <div className="p-3 bg-[#111] border-b border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Select Currency</div>
                    <div className="flex flex-col gap-1.5">
                      {CRYPTO_COINS.map(coin => (
                        <button
                          key={coin.id}
                          onClick={() => { setSelectedCryptoCoin(coin.id); setIsDropdownOpen(false); setIsCryptoExpanded(false); }}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${selectedCryptoCoin === coin.id ? 'bg-white/10 border border-white/20' : 'bg-[#1c1c1c] border border-white/5 hover:bg-white/5'}`}
                        >
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-black ${coin.bg} ${coin.color}`}>
                            {coin.icon}
                          </div>
                          <span className={`text-sm font-bold ${selectedCryptoCoin === coin.id ? 'text-white' : 'text-gray-400'}`}>{coin.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => { setPaymentMethod("balance"); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/10 rounded-full">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-white">Balance</div>
                    <div className="text-xs text-gray-500">Pay with your NFA Store balance <span className="text-emerald-400">(Instant)</span></div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

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
            disabled={loadingCheckout || loadingStock || stock === 0 || (paymentMethod === 'crypto' && totalPrice < 10)}
            className="w-full bg-[#eeeeee] text-black font-semibold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCheckout ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              `Pay €${totalPrice.toFixed(2)} with ${paymentMethod === "stripe" ? "Stripe" : "Balance"}`
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
  );
}
