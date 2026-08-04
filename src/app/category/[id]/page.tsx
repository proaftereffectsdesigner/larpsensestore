"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, ChevronRight, ChevronLeft, Minus, Plus, ShieldCheck, Gamepad2, Info, Zap, Lock, RefreshCcw, ShieldAlert, Star } from "lucide-react";
import { SiSolana, SiLitecoin, SiTether, SiBitcoin } from "react-icons/si";

import ParticlesBackground from "@/components/ParticlesBackground";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";

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
  
  const categoryProducts = (() => {
    if (id === "prime") return products.filter(p => p.id === "prime");
    if (id === "premier") return products.filter(p => p.id === "premier");
    if (id === "premier-4-medals") return products.filter(p => p.id.includes("-medals"));
    if (id === "premier-10k") return products.filter(p => p.id.includes("k"));
    if (id === "premier-rare") return products.filter(p => p.id === "premier-rare");
    // Fallback if accessed via direct variant id (e.g. /category/premier-10-medals)
    if (typeof id === 'string' && id.includes("-medals")) return products.filter(p => p.id.includes("-medals"));
    if (typeof id === 'string' && id.includes("k")) return products.filter(p => p.id.includes("k"));
    return products.filter(p => p.id === id); // exact match fallback
  })();
  
  const defaultSelected = categoryProducts.find(p => p.id === id) || categoryProducts[0];
  const [selectedProductId, setSelectedProductId] = useState<string>(defaultSelected?.id || "");
  const selectedProduct = categoryProducts.find(p => p.id === selectedProductId);

  const [stock, setStock] = useState<number | null>(null);
  const [allStockData, setAllStockData] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"polar" | "crypto" | "balance">("polar");
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isCryptoExpanded, setIsCryptoExpanded] = useState(false);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({ stripe_enabled: true, crypto_enabled: true });

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "best" | "worst">("newest");
  const reviewsPerPage = 8;
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const toggleReview = (index: number) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedReviews(newSet);
  };

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
      
      // Track checkout session started
      const sessionId = localStorage.getItem("analytics_session_id") || crypto.randomUUID();
      if (!localStorage.getItem("analytics_session_id")) {
        localStorage.setItem("analytics_session_id", sessionId);
      }

      supabase.from("checkout_sessions").insert({
        session_id: sessionId,
        product_type: selectedProduct.type,
        status: 'started'
      }).then(({ error }) => {
        if (error) console.warn("Analytics (checkout_sessions):", error.message || error);
      });

      // Fetch reviews
      setReviewsLoading(true);
      fetch(`/api/reviews?product_type=${selectedProduct.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.reviews) setReviews(data.reviews);
        })
        .finally(() => setReviewsLoading(false));
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

    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (paymentMethod === "crypto") {
        const res = await fetch("/api/create-oxapay-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            token,
            amount: totalPrice,
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

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const totalPrice = selectedProduct.price * quantity;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "best") return b.rating - a.rating;
    if (sortBy === "worst") return a.rating - b.rating;
    return 0;
  });

  return (
    <div className="flex flex-col items-center py-12 px-4 relative z-10 min-h-[calc(100vh-80px)] mt-8">
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
              Product Details
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Instant Delivery:</strong> Secure account file available in your dashboard immediately after purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>NFA Account:</strong> Connect seamlessly using our LarpSense NFA Tool.</span>
              </li>
              {id === "prime" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Prime Status:</strong> Upgraded for Prime matchmaking right out of the box.</span>
                </li>
              )}
              {id === "premier" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Premier Ready:</strong> Level 10 reached and ready to calibrate your Premier Rating.</span>
                </li>
              )}
              {id === "premier-4-medals" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Premier with Medals:</strong> Premier-ready access equipped with at least 4 in-game service medals.</span>
                </li>
              )}
              {id === "premier-10-medals" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Premier Elite Medals:</strong> Premier-ready access equipped with 10 or more in-game service medals.</span>
                </li>
              )}
              {id === "premier-10k" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>10,000+ Rating:</strong> Calibrated and secured at a guaranteed 10,000+ CS Rating.</span>
                </li>
              )}
              {id === "premier-15k" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>15,000+ Rating:</strong> Calibrated and secured at a guaranteed 15,000+ CS Rating.</span>
                </li>
              )}
              {id === "premier-20k" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>20,000+ Rating:</strong> High-tier calibration secured at a guaranteed 20,000+ CS Rating.</span>
                </li>
              )}
              {id === "premier-rare" && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span><strong>Rare Inventory:</strong> Equipped with premium assets, guaranteeing at least one Knife or Glove item.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <RefreshCcw className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Automated Warranty:</strong> Covered by our automated 1:1 replacement system if the account expires within the 6-hour window.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Prawa kolumna: Konfigurator i Płatność */}
        <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative lg:sticky lg:top-24 overflow-visible">
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h1 className="text-2xl font-bold text-white">Configure your order</h1>
            {!reviewsLoading && totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-sm font-bold text-white">{averageRating}</span>
                <span className="text-xs text-gray-500 font-medium">({totalReviews} reviews)</span>
              </div>
            )}
          </div>

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

          {/* Sekcja Metoda Płatności — inline, nie dropdown */}
          <div className="mb-8">
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Payment method</div>
            <div ref={paymentDropdownRef} className="flex flex-col gap-2">

              {loadingSettings ? (
                <>
                  <div className="w-full h-[66px] bg-[#0a0a0a]/50 border border-white/5 rounded-xl animate-pulse"></div>
                  <div className="w-full h-[66px] bg-[#0a0a0a]/50 border border-white/5 rounded-xl animate-pulse"></div>
                </>
              ) : (
                <>
              {/* Polar */}
              <button 
                onClick={() => { if (settings.stripe_enabled) { setPaymentMethod("polar"); } }}
                disabled={!settings.stripe_enabled}
                className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 border transition-all ${!settings.stripe_enabled ? "opacity-50 cursor-not-allowed grayscale bg-[#0a0a0a]/50 border-white/5" : paymentMethod === "polar" ? "bg-white/5 border-white/20" : "bg-[#0a0a0a]/50 border-white/10 hover:bg-white/5 hover:border-white/20"}`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${paymentMethod === "polar" ? "bg-gray-500/10" : "bg-[#141414] border border-white/5"}`}>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${paymentMethod === "polar" ? "text-white" : "text-gray-400"}`}>Debit / Credit Card</div>
                  <div className="text-xs text-gray-500">{!settings.stripe_enabled ? 'Temporarily disabled' : 'Mastercard, Visa, Apple Pay etc.'} <span className="text-indigo-400 font-bold">{settings.stripe_enabled ? '(3.5% + €0.30 fee)' : ''}</span></div>
                </div>
              </button>

              {/* Crypto */}
              <div className={`rounded-xl border transition-all ${!settings.crypto_enabled ? 'opacity-50 cursor-not-allowed bg-[#0a0a0a]/50 border-white/5 grayscale' : paymentMethod === "crypto" ? "border-white/20" : "border-white/10"}`}>
                <button
                  onClick={() => settings.crypto_enabled && setPaymentMethod("crypto")}
                  disabled={!settings.crypto_enabled}
                  className={`w-full px-4 py-3 rounded-xl text-left flex items-center justify-between ${!settings.crypto_enabled ? "" : paymentMethod === "crypto" ? "bg-white/5" : "bg-[#0a0a0a]/50 hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${paymentMethod === "crypto" ? "bg-amber-500/10" : "bg-[#141414] border border-white/5"}`}>
                      <SiBitcoin className={`w-5 h-5 ${paymentMethod === "crypto" ? "text-amber-400" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${paymentMethod === "crypto" ? "text-white" : "text-gray-400"}`}>Cryptocurrency</div>
                      <div className="text-xs text-gray-500">
                        {!settings.crypto_enabled ? 'Temporarily disabled' : 'Pay via OxaPay'} <span className="text-amber-400 font-bold">{settings.crypto_enabled ? '(0.5% fee)' : ''}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Balance */}
              <button
                onClick={() => { setPaymentMethod("balance"); }}
                className={`w-full px-4 py-3 rounded-xl text-left flex items-center gap-3 border transition-all ${paymentMethod === "balance" ? "bg-white/5 border-white/20" : "bg-[#0a0a0a]/50 border-white/10 hover:bg-white/5 hover:border-white/20"}`}
              >
                <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm text-white font-medium">Balance</div>
                  <div className="text-xs text-gray-500">Pay with your NFA Store balance <span className="text-emerald-400">(Instant)</span></div>
                </div>
              </button>

                </>
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
              disabled={loadingCheckout || loadingStock || stock === 0 || (paymentMethod === 'crypto' && selectedCryptoCoin === 'USDT_TON' && totalPrice < 5)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {loadingCheckout ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                  `Pay €${totalPrice.toFixed(2)} with ${paymentMethod === "polar" ? "Card" : paymentMethod === "crypto" ? "Crypto" : "Balance"}`
              )}
            </button>
          )}
          
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="w-full max-w-5xl mt-16 px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            Verified Reviews for {selectedProduct.name}
          </h2>
          {!reviewsLoading && totalReviews > 0 && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 font-medium focus:outline-none focus:border-white/20"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="best">Highest Rated</option>
                  <option value="worst">Lowest Rated</option>
                </select>
              </div>
              <div className="text-sm text-gray-400 font-medium hidden sm:block">
                <span className="text-white font-bold text-lg mr-1">{averageRating}</span>/ 5.0
              </div>
            </div>
          )}
        </div>
        
        {reviewsLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage).map((review, i) => (
                <div key={i} className="p-6 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl hover:border-white/10 transition-colors shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] ml-auto bg-green-500/10 text-green-400 px-2 py-1 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <p className="text-gray-300 italic mb-1">
                    "{review.comment ? (
                      expandedReviews.has(i) || review.comment.length <= 150 
                        ? review.comment 
                        : review.comment.slice(0, 150) + '...'
                    ) : 'Great service!'}"
                  </p>
                  {review.comment && review.comment.length > 150 && (
                    <button 
                      onClick={() => toggleReview(i)}
                      className="text-accent text-xs font-bold hover:underline mb-4 text-left"
                    >
                      {expandedReviews.has(i) ? "Show less" : "Show more"}
                    </button>
                  )}
                  {!review.comment || review.comment.length <= 150 ? <div className="mb-4"></div> : null}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-gray-500">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                    <Link href={`/user/${review.profiles?.id}`} className="text-sm font-bold text-gray-300 hover:text-white transition-colors flex flex-col leading-tight">
                      <span>{review.profiles?.display_name || 'Anonymous'}</span>
                      <span className="text-[10px] text-accent font-normal hover:underline">View Profile</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {Math.ceil(reviews.length / reviewsPerPage) > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all bg-[#141414] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.ceil(reviews.length / reviewsPerPage) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      currentPage === i + 1 
                        ? 'bg-emerald-500 text-black' 
                        : 'bg-[#141414] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(Math.ceil(reviews.length / reviewsPerPage), currentPage + 1));
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === Math.ceil(reviews.length / reviewsPerPage)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all bg-[#141414] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl text-center shadow-xl">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto">This variant doesn't have any reviews yet. Be the first to review it after purchase!</p>
          </div>
        )}
      </div>

    </div>
  );
}
