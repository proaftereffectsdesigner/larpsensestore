"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, Minus, Plus, ShieldCheck, Gamepad2, Info, Bitcoin, Zap, Lock, RefreshCcw } from "lucide-react";
import { SiStripe } from "react-icons/si";
import ParticlesBackground from "@/components/ParticlesBackground";
import Image from "next/image";

export default function CategoryPage() {
  const { id } = useParams(); // 'prime' or 'premier'
  const router = useRouter();

  const getStockColor = (stockAmount: number | null) => {
    if (stockAmount === null) return "text-gray-500";
    if (stockAmount === 0) return "text-red-400";
    if (stockAmount >= 100) return "text-green-400";
    if (stockAmount >= 50) return "text-yellow-400";
    return "text-orange-400";
  };
  
  const categoryProducts = products.filter(p => id === "prime" ? p.id === "prime" : p.id.startsWith("premier"));
  
  const [selectedProductId, setSelectedProductId] = useState<string>(categoryProducts[0]?.id || "");
  const selectedProduct = categoryProducts.find(p => p.id === selectedProductId);

  const [stock, setStock] = useState<number | null>(null);
  const [allStockData, setAllStockData] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto" | "balance">("stripe");
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);

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
    setLoadingStock(true);
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock && data.stock.cs2) {
          setAllStockData(data.stock.cs2);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStock(false));
  }, [id]);

  useEffect(() => {
    if (allStockData && selectedProduct) {
      const available = allStockData[selectedProduct.type]?.available || 0;
      setStock(available);
      setQuantity(1); // reset quantity when product changes
    }
  }, [selectedProduct, allStockData]);

  if (categoryProducts.length === 0) {
    return <div className="p-20 text-center text-white">Category not found</div>;
  }

  const handleQuantityChange = (delta: number) => {
    if (loadingStock || stock === 0) return;
    const max = Math.min(100, stock || 100);
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= max) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loadingStock || stock === 0) return;
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    
    const max = Math.min(100, stock || 100);
    if (val >= 1 && val <= max) {
      setQuantity(val);
    } else if (val > max) {
      setQuantity(max);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      window.dispatchEvent(new Event('open-auth'));
      return;
    }
    if (!selectedProduct) return;

    const totalPrice = selectedProduct.price * quantity;

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
            productId: selectedProduct.id,
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
            productId: selectedProduct.id, 
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

  if (!selectedProduct) return null;

  const totalPrice = selectedProduct.price * quantity;

  return (
    <div className="flex justify-center items-start py-12 px-4 relative z-10 min-h-[calc(100vh-80px)] mt-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Lewa kolumna: Grafika i Opis */}
        <div className="flex flex-col gap-6">
          {/* Obrazek (Graphic Placeholder) */}
          <div className="w-full aspect-[4/3] relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] group transition-all">
            <Image 
              src={id === "prime" ? "/prime-bg.png" : "/premier-bg.jpg"} 
              alt={id === "prime" ? "CS2 Prime Ready" : "CS2 Premier Ready"} 
              fill 
              className="object-cover transition-transform duration-700 scale-[1.15] group-hover:scale-[1.20]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/20 to-transparent z-10 pointer-events-none" />
          </div>

          {/* Opis Produktu */}
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-gray-300">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Account Details
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Instant Delivery:</strong> Secure token file dispatched to your email immediately after purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>NFA Format:</strong> Non-Full Access account. Log in seamlessly using the LarpSense NFA Tool. The original email is not provided.</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCcw className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Automated Warranty:</strong> Covered by our automated 1:1 replacement system if the token expires within the 6-hour window.</span>
              </li>
              {id === "premier" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Premier Ready:</strong> Level 10 reached and ready to calibrate your Premier CS Rating.</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Prawa kolumna: Konfigurator i Płatność */}
        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative lg:sticky lg:top-24 overflow-visible">
          
          <h1 className="text-2xl font-bold text-white mb-8 relative z-10">Configure your order</h1>

          {/* Sekcja Wybór Wariantu */}
          {categoryProducts.length > 1 && (
            <div className="mb-6 z-30 relative">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Select Variant</div>
              <div className="relative">
                <button 
                  onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                  className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white flex items-center justify-between hover:border-emerald-500/50 hover:bg-white/5 transition-all shadow-inner focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{selectedProduct.name}</div>
                      <div className="text-xs text-gray-500">€{selectedProduct.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isVariantDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isVariantDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {categoryProducts.map((p) => {
                      const variantStock = allStockData ? (allStockData[p.type]?.available || 0) : null;
                      return (
                        <button 
                          key={p.id}
                          onClick={() => { setSelectedProductId(p.id); setIsVariantDropdownOpen(false); }}
                          disabled={variantStock === 0}
                          className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between border-b border-white/5 last:border-0 ${
                            variantStock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
                          } ${selectedProductId === p.id ? 'bg-white/5' : ''}`}
                        >
                          <div>
                            <div className="text-sm text-white">{p.name}</div>
                            <div className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1 ${getStockColor(variantStock)}`}>
                              {variantStock === null ? (
                                "Checking..."
                              ) : variantStock > 0 ? (
                                <><CheckCircle2 className="w-3 h-3" /> {variantStock} In Stock</>
                              ) : (
                                "Out of Stock"
                              )}
                            </div>
                          </div>
                          <div className="font-mono text-sm text-accent">€{p.price.toFixed(2)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cena */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1 flex justify-between items-center">
              <span>Total Price</span>
            </div>
            <div className="text-5xl font-medium text-white tracking-tight flex items-baseline gap-2">
              €{totalPrice.toFixed(2)}
              {quantity > 1 && <span className="text-sm text-gray-500 font-sans tracking-normal">(€{selectedProduct.price.toFixed(2)} ea)</span>}
            </div>
          </div>

          {/* Sekcja Email */}
          <div className="mb-6">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Email for your order</div>
            <div className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm shadow-inner">
              {authChecked ? (user?.email || "Not logged in") : "Loading..."}
            </div>
          </div>

          {/* Sekcja Ilości */}
          <div className="mb-6 flex items-center justify-between bg-[#0a0a0a]/50 border border-white/10 p-4 rounded-xl shadow-inner">
            <div className="text-[14px] font-bold text-white flex flex-col">
              Quantity
              <span className={`text-[10px] uppercase tracking-widest mt-1 ${getStockColor(stock)}`}>
                {loadingStock ? "Checking..." : stock === 0 ? "Out of stock" : `${stock} In Stock`}
              </span>
            </div>
            <div className="flex items-center bg-black/40 border border-white/5 rounded-xl overflow-hidden">
              <button 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || loadingStock || stock === 0}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input 
                type="number"
                value={quantity}
                onChange={handleQuantityInputChange}
                className="w-16 h-10 flex items-center justify-center text-center text-white font-mono text-sm border-x border-white/5 bg-transparent focus:outline-none focus:bg-white/5 transition-colors"
                min="1"
                max={Math.min(100, stock || 100)}
                disabled={loadingStock || stock === 0}
              />
              <button 
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= Math.min(100, stock || 100) || loadingStock || stock === 0}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sekcja Metoda Płatności */}
          <div className="mb-8 relative z-20">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Payment method</div>
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white flex items-center justify-between hover:border-emerald-500/50 hover:bg-white/5 transition-all shadow-inner focus:outline-none"
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
                    <div className="text-xs text-gray-500">
                      {paymentMethod === "stripe" ? "Mastercard, Visa, Apple Pay etc. via Stripe (1.5% + €0.25 fee)" : paymentMethod === "crypto" ? (selectedCryptoCoin ? `${CRYPTO_COINS.find(c => c.id === selectedCryptoCoin)?.name} (0.5% fee)` : "BTC, ETH, LTC, USDT, SOL (0.5% fee)") : "Pay with your NFA Store balance"}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    onClick={() => { setPaymentMethod("crypto"); setIsDropdownOpen(false); if (!selectedCryptoCoin) setSelectedCryptoCoin(CRYPTO_COINS[0].id); }}
                    className={`w-full px-4 py-3 text-left transition-colors flex flex-col border-b border-white/5 ${paymentMethod === "crypto" ? 'bg-white/5' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-500/10 rounded-full">
                        <Bitcoin className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white">Cryptocurrency</div>
                        <div className="text-xs text-gray-500">BTC, ETH, LTC, USDT, SOL <span className="text-amber-400">(0.5% fee)</span></div>
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
                      <div className="text-xs text-gray-500">Pay with your NFA Store balance <span className="text-emerald-400">(Instant)</span></div>
                    </div>
                  </button>
                </div>
              )}
              
              {/* INLINE CRYPTO SELECTION */}
              {paymentMethod === 'crypto' && (
                <div className="mt-2 p-4 bg-[#0a0a0a]/50 border border-white/10 rounded-xl shadow-inner">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-3">Select Currency</div>
                  <div className="grid grid-cols-2 gap-2">
                    {CRYPTO_COINS.map(coin => (
                      <button
                        key={coin.id}
                        onClick={() => setSelectedCryptoCoin(coin.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all ${selectedCryptoCoin === coin.id ? 'bg-white/10 border border-white/20 shadow-inner' : 'bg-[#1c1c1c] border border-white/5 hover:bg-white/5'}`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${coin.bg} ${coin.color}`}>
                          {coin.icon}
                        </div>
                        <span className={`text-xs font-bold ${selectedCryptoCoin === coin.id ? 'text-white' : 'text-gray-400'}`}>{coin.name}</span>
                      </button>
                    ))}
                  </div>
                  {totalPrice < 10 && (
                    <div className="mt-3 text-xs font-medium text-amber-400/90 bg-amber-400/10 p-3 rounded-xl flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      Minimum amount for cryptocurrency is €10.00
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Przycisk Płatności */}
          {authChecked && !user ? (
            <button 
              onClick={() => window.dispatchEvent(new Event('open-auth'))}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
            >
              Sign in to pay
            </button>
          ) : (
            <button 
              onClick={handleCheckout}
              disabled={loadingCheckout || loadingStock || stock === 0 || (paymentMethod === 'crypto' && totalPrice < 10)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {loadingCheckout ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                `Pay €${totalPrice.toFixed(2)}`
              )}
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}
