"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products, getProductImage } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, ChevronRight, ChevronLeft, Minus, Plus, ShieldCheck, Gamepad2, Info, Zap, Lock, RefreshCcw, ShieldAlert, Star, CircleDollarSign, Timer, Key, Shield, Award, Crown, Medal } from "lucide-react";
import { SiStripe, SiSolana, SiLitecoin, SiTether, SiBitcoin, SiEthereum } from "react-icons/si";
import { CryptoPaymentModal } from "@/components/dashboard/CryptoPaymentModal";
import { toast } from "sonner";
import { useCurrency } from "@/lib/CurrencyContext";

import ParticlesBackground from "@/components/ParticlesBackground";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

export default function ProductDetailView() {
  const { id } = useParams();
  const router = useRouter();

  const getStockColor = (stockAmount: number | null) => {
    if (stockAmount === null) return "text-gray-500";
    if (stockAmount === 0) return "text-red-400";
    if (stockAmount >= 100) return "text-green-400";
    if (stockAmount >= 50) return "text-yellow-400";
    return "text-orange-400";
  };
  
  const selectedProduct = products.find(p => p.id === id);
  const { convert, currency } = useCurrency();

  const [stock, setStock] = useState<number | null>(null);
  const [allStockData, setAllStockData] = useState<any>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto" | "balance">("stripe");
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<string | null>(null);
  const [isCryptoCoinDropdownOpen, setIsCryptoCoinDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({ stripe_enabled: true, crypto_enabled: true });
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{ payAddress: string, payAmount: string | number, trackId: string, orderId?: string } | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "best" | "worst">("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortOptions = {
    newest: "Most Recent",
    oldest: "Oldest",
    best: "Highest Rated",
    worst: "Lowest Rated"
  };
  const reviewsPerPage = 8;
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const toggleReview = (index: number) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedReviews(newSet);
  };

  const [promoCode, setPromoCode] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [promoCodeError, setPromoCodeError] = useState("");
  const [promoCodeSuccess, setPromoCodeSuccess] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoCodeError("");
    setPromoCodeSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
         window.dispatchEvent(new Event('open-auth'));
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
        setPromoCodeSuccess(data.message);
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
        if (data.ok && data.stock) {
          setAllStockData(data.stock);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStock(false));
  }, [id]);

  useEffect(() => {
    if (allStockData && selectedProduct) {
      const available = allStockData[selectedProduct.endpoint]?.[selectedProduct.type]?.available || 0;
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

  if (!selectedProduct) {
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

    const rawTotalPrice = selectedProduct.price * quantity;

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
            amount: rawTotalPrice, // Backend recalculates with promo
            type: "product_checkout",
            productId: selectedProduct.id,
            quantity: quantity,
            currency: selectedCryptoCoin,
            promoCode: promoCode.trim() || undefined
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
            productId: selectedProduct.id, 
            quantity, 
            userId: user.id,
            token,
            paymentMethod,
            currency,
            promoCode: promoCode.trim() || undefined
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

  if (!selectedProduct) return null;

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const rawTotalPrice = selectedProduct.price * quantity;
  const costAmount = discountPct > 0 ? Number((rawTotalPrice * (1 - discountPct / 100)).toFixed(2)) : rawTotalPrice;

  const feeMultiplier = 0.015;
  const fixedFee = 0.25;
  const cardFee = paymentMethod === "stripe" ? Number((costAmount * feeMultiplier + fixedFee).toFixed(2)) : 0;
  const finalAmount = costAmount + cardFee;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "best") return b.rating - a.rating;
    if (sortBy === "worst") return a.rating - b.rating;
    return 0;
  });

  return (
    <>
    <div className="flex flex-col items-center py-12 px-4 relative z-10 min-h-[calc(100vh-80px)] mt-8">
      {/* Back Button */}
      <div className="w-full max-w-6xl flex justify-start mb-6">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium group"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
        
        {/* Left column: Image & Features */}
        <div className="lg:col-span-7 flex flex-col gap-12">
          {/* Image */}
          <div className="w-full aspect-[4/3] relative rounded-3xl overflow-hidden bg-[#111] border border-white/5 group">
            <Image 
              src={selectedProduct?.image || getProductImage(selectedProduct?.id || (typeof id === 'string' ? id : ''), selectedProduct?.category)} 
              alt={selectedProduct?.name || "Product"} 
              fill 
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-500 scale-100 group-hover:scale-105" 
            />
          </div>
          
          {/* Clean Description */}
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-semibold text-white tracking-tight">The essentials.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
              <div className="flex flex-col gap-2">
                <div className="text-white font-medium flex items-center gap-2.5">
                  <Timer className="w-5 h-5 text-[#47c92f]" />
                  Instant Delivery
                </div>
                <div className="text-gray-400 text-sm leading-relaxed">Get your account immediately after payment. No waiting.</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-white font-medium flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-[#47c92f]" />
                  NFA Account
                </div>
                <div className="text-gray-400 text-sm leading-relaxed">Use our LarpSense NFA tool to log in with one click. Simple as that.</div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-white font-medium flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-[#47c92f]" />
                  One-Click Warranty
                </div>
                <div className="text-gray-400 text-sm leading-relaxed">Dead account? Just click "replace" on your order page within 6 hours to get a new one instantly.</div>
              </div>
              
              {id === "prime" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-[#47c92f]" />
                    Prime Status
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Ready for Prime matchmaking as soon as you log in.</div>
                </div>
              )}
              {id === "premier" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-[#47c92f]" />
                    Premier Ready
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Level 10 unlocked. Ready to play Premier matchmaking right away.</div>
                </div>
              )}
              {id === "premier-4-medals" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Medal className="w-5 h-5 text-[#47c92f]" />
                    Premier with Medals
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Ready for Premier with at least 4 service medals on the account.</div>
                </div>
              )}
              {id === "premier-10-medals" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Medal className="w-5 h-5 text-[#47c92f]" />
                    Premier Elite Medals
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Ready for Premier with 10+ service medals on the account.</div>
                </div>
              )}
              {id === "premier-inactive" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Timer className="w-5 h-5 text-[#47c92f]" />
                    14+ Days Inactive
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Account hasn't been touched in over 14 days, making it super safe to use.</div>
                </div>
              )}
              {id === "premier-10k" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-[#47c92f]" />
                    10,000+ Rating
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Already calibrated with a guaranteed 10,000+ CS rating.</div>
                </div>
              )}
              {id === "premier-15k" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-[#47c92f]" />
                    15,000+ Rating
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Already calibrated with a guaranteed 15,000+ CS rating.</div>
                </div>
              )}
              {id === "premier-20k" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-[#47c92f]" />
                    20,000+ Rating
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Already calibrated with a guaranteed 20,000+ CS rating.</div>
                </div>
              )}
              {id === "premier-rare" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Star className="w-5 h-5 text-[#47c92f]" />
                    Rare Inventory
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Comes with a premium inventory, including at least one Knife or Glove.</div>
                </div>
              )}
              {selectedProduct?.category === "rust" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Timer className="w-5 h-5 text-[#47c92f]" />
                    {selectedProduct.name.replace("Rust ", "")}
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">Account comes with {selectedProduct.name.replace("Rust ", "").toLowerCase()} already played on record.</div>
                </div>
              )}
              {selectedProduct?.category === "extra" && (
                <div className="flex flex-col gap-2">
                  <div className="text-white font-medium flex items-center gap-2.5">
                    <Gamepad2 className="w-5 h-5 text-[#47c92f]" />
                    Standard NFA
                  </div>
                  <div className="text-gray-400 text-sm leading-relaxed">This is a standard NFA account. The game is included and ready to play.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Sticky Checkout */}
        <div className="lg:col-span-5 flex flex-col relative lg:sticky lg:top-24 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-semibold text-white tracking-tight flex items-center gap-2">
                <span>{selectedProduct.name}</span>
                {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-6 h-6 -mt-1 inline-block" />}
              </h1>
            </div>
            {totalReviews > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
                <Star className="w-4 h-4 text-[#47c92f] fill-[#47c92f]" />
                <span className="text-white">{averageRating}</span>
                <span className="mx-1">&middot;</span>
                <a href="#reviews" className="hover:text-white hover:underline transition-all">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </a>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="text-5xl font-medium text-white tracking-tight flex items-baseline gap-3">
              {discountPct > 0 ? (
                <span className="text-3xl line-through text-gray-500">{convert(rawTotalPrice + cardFee).formatted}</span>
              ) : selectedProduct.originalPrice ? (
                <span className="text-3xl line-through text-gray-500">{convert((selectedProduct.originalPrice * quantity) + (paymentMethod === "stripe" ? cardFee : 0)).formatted}</span>
              ) : null}
              {convert(finalAmount).formatted}
              {HALLOWEEN_EVENT_ENABLED && (
                <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 rounded-full self-center">
                  -15% Halloween
                </span>
              )}
              {quantity > 1 && <span className="text-lg text-gray-500 font-normal">({convert(selectedProduct.price).formatted} ea)</span>}
            </div>
            {paymentMethod === "stripe" && (
              <div className="text-sm text-gray-500 font-medium">
                Includes <span className="text-indigo-400">{convert(cardFee).formatted}</span> card processing fee
              </div>
            )}
            {paymentMethod === "crypto" && (
              <div className="text-sm text-gray-500 font-medium">
                Includes <span className="text-amber-500">0%</span> crypto processing fee
              </div>
            )}
            {paymentMethod === "balance" && (
              <div className="text-sm text-gray-500 font-medium">
                Includes <span className="text-emerald-500">0%</span> balance fee
              </div>
            )}
          </div>

          <div className="w-full h-px bg-[#222]" />

          {/* Config */}
          <div className="flex flex-col gap-6">
            
            {/* Quantity */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-white font-medium">Quantity</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md w-fit tracking-wide ${stock === 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-gray-300'}`}>
                  {loadingStock ? "CHECKING..." : stock === 0 ? "OUT OF STOCK" : `${stock} IN STOCK`}
                </span>
              </div>
              <div className="flex items-center border border-[#333] rounded-lg overflow-hidden bg-[#111]">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || loadingStock || stock === 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-[#222] hover:text-white transition-colors disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number"
                  value={quantity}
                  onChange={handleQuantityInputChange}
                  className="w-12 h-10 text-center text-white font-medium border-x border-[#333] bg-transparent focus:outline-none"
                  min="1"
                  max={Math.min(100, stock || 100)}
                  disabled={loadingStock || stock === 0}
                />
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= Math.min(100, stock || 100) || loadingStock || stock === 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-[#222] hover:text-white transition-colors disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Promo */}
            <div className="flex flex-col gap-2">
              <span className="text-white font-medium text-sm">Promo Code</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-white transition-colors"
                />
                <button
                  onClick={applyPromoCode}
                  disabled={isApplyingPromo || !promoCode.trim()}
                  className="px-6 py-3 bg-[#222] hover:bg-[#333] text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {isApplyingPromo ? "Applying..." : "Apply"}
                </button>
              </div>
              {promoCodeSuccess && <p className="text-sm text-emerald-400 mt-1">{promoCodeSuccess}</p>}
              {promoCodeError && <p className="text-sm text-red-400 mt-1">{promoCodeError}</p>}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3">
              <span className="text-white font-medium text-sm">Payment Method</span>
              {loadingSettings ? (
                <div className="w-full h-14 bg-[#111] rounded-lg animate-pulse" />
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => { if (settings.stripe_enabled) setPaymentMethod("stripe"); }}
                    disabled={!settings.stripe_enabled}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${paymentMethod === "stripe" ? "border-[#47c92f] bg-[#47c92f]/5" : "border-[#333] bg-[#111] hover:border-gray-500"} ${!settings.stripe_enabled && "opacity-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <SiStripe className={`w-5 h-5 ${paymentMethod === "stripe" ? "text-[#635BFF]" : "text-gray-400"}`} />
                      <span className={`font-medium ${paymentMethod === "stripe" ? "text-white" : "text-gray-300"}`}>Card</span>
                    </div>
                    {settings.stripe_enabled && <span className="text-xs font-medium text-gray-500">1.5% + {convert(0.25).formatted} fee</span>}
                  </button>

                  <div className={`flex flex-col rounded-lg border transition-all ${paymentMethod === "crypto" ? "border-[#47c92f] bg-[#47c92f]/5" : "border-[#333] bg-[#111]"} ${!settings.crypto_enabled && "opacity-50"}`}>
                    <button
                      onClick={() => { if (settings.crypto_enabled) setPaymentMethod("crypto"); }}
                      disabled={!settings.crypto_enabled}
                      className="flex items-center justify-between p-4 hover:opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <SiBitcoin className={`w-5 h-5 ${paymentMethod === "crypto" ? "text-amber-500" : "text-gray-400"}`} />
                        <span className={`font-medium ${paymentMethod === "crypto" ? "text-white" : "text-gray-300"}`}>Crypto</span>
                      </div>
                      {settings.crypto_enabled && <span className="text-xs font-medium text-amber-500/80">0% fee</span>}
                    </button>
                    {paymentMethod === "crypto" && (
                      <div className="px-4 pb-4 pt-2">
                        <div className="relative">
                          <button
                            onClick={() => setIsCryptoCoinDropdownOpen(!isCryptoCoinDropdownOpen)}
                            className="w-full flex items-center justify-between p-3 rounded border bg-[#111] border-[#333] text-white hover:bg-[#222] transition-colors"
                          >
                            <span className="text-sm font-medium">
                              {selectedCryptoCoin ? selectedCryptoCoin : "Select currency..."}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          {isCryptoCoinDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#333] rounded overflow-hidden z-50 shadow-xl">
                              {[
                                { id: 'BTC', label: 'Bitcoin', icon: <SiBitcoin className="w-4 h-4 text-amber-500" /> },
                                { id: 'ETH', label: 'Ethereum', icon: <SiEthereum className="w-4 h-4 text-indigo-400" /> },
                                { id: 'USDT_TRC20', label: 'USDT', icon: <SiTether className="w-4 h-4 text-emerald-500" /> },
                                { id: 'USDC_ERC20', label: 'USDC', icon: <CircleDollarSign className="w-4 h-4 text-blue-400" /> },
                                { id: 'LTC', label: 'Litecoin', icon: <SiLitecoin className="w-4 h-4 text-blue-400" /> },
                                { id: 'SOL', label: 'Solana', icon: <SiSolana className="w-4 h-4 text-purple-500" /> }
                              ].map((coin) => (
                                <button
                                  key={coin.id}
                                  onClick={() => { setSelectedCryptoCoin(coin.id); setIsCryptoCoinDropdownOpen(false); }}
                                  className="w-full flex items-center gap-2 p-3 text-left text-sm text-white hover:bg-[#222] border-b border-[#222] last:border-0 transition-colors"
                                >
                                  {coin.icon}
                                  {coin.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setPaymentMethod("balance")}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${paymentMethod === "balance" ? "border-[#47c92f] bg-[#47c92f]/5" : "border-[#333] bg-[#111] hover:border-gray-500"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className={`w-5 h-5 ${paymentMethod === "balance" ? "text-emerald-500" : "text-gray-400"}`} />
                      <span className={`font-medium ${paymentMethod === "balance" ? "text-white" : "text-gray-300"}`}>Balance</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-500/80">0% fee</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              {authChecked && !user ? (
                <button 
                  onClick={() => window.dispatchEvent(new Event('open-auth'))}
                  className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors text-lg"
                >
                  Sign in to buy
                </button>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={loadingCheckout || loadingStock || stock === 0 || (paymentMethod === 'crypto' && selectedCryptoCoin === 'BTC' && rawTotalPrice < 15)}
                  className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCheckout ? "Processing..." : `Buy for ${convert(finalAmount).formatted}`}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="w-full max-w-6xl mt-24 px-0 lg:px-0">
        <div className="w-full h-px bg-[#222] mb-16" />
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-white tracking-tight">Reviews</h2>
            {!reviewsLoading && totalReviews > 0 && (
              <div className="text-gray-400 text-lg">
                <span className="text-white font-medium">{averageRating} out of 5</span> based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}.
              </div>
            )}
          </div>
          
          {!reviewsLoading && totalReviews > 0 && (
            <div className="relative">
              <button 
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-3 bg-[#111] rounded-lg pl-4 pr-3 py-2.5 border border-[#333] hover:bg-[#222] transition-colors"
              >
                <span className="text-sm font-medium text-white">{sortOptions[sortBy as keyof typeof sortOptions]}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#333] rounded-lg shadow-2xl overflow-hidden z-50">
                  {Object.entries(sortOptions).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortBy(key as any);
                        setCurrentPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === key ? 'bg-[#222] text-white font-medium' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {reviewsLoading ? (
          <div className="py-20 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
              {sortedReviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage).map((review, i) => (
                <div key={i} className="flex flex-col bg-[#111] p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#47c92f]/10 flex items-center justify-center text-[#47c92f] font-semibold text-lg">
                      {(review.profiles?.display_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{review.profiles?.display_name || 'Anonymous'}</span>
                        <span className="text-gray-600">&middot;</span>
                        <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-3.5 h-3.5 ${idx < review.rating ? 'text-[#47c92f] fill-[#47c92f]' : 'text-[#333]'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-base leading-relaxed">
                    {review.comment || 'Great service!'}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {Math.ceil(reviews.length / reviewsPerPage) > 1 && (
              <div className="flex justify-center mt-16 pt-8 border-t border-[#222] gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-colors text-white disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-[#111]"
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
                    className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-white text-black' 
                        : 'text-gray-400 hover:text-white hover:bg-[#111]'
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
                  className="w-10 h-10 rounded flex items-center justify-center text-sm font-medium transition-colors text-white disabled:text-gray-600 disabled:cursor-not-allowed hover:bg-[#111]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">
            No reviews yet for this product.
          </div>
        )}
      </div>
    </div>
    
    {cryptoPaymentData && (
      <CryptoPaymentModal
        payAddress={cryptoPaymentData.payAddress}
        payAmount={cryptoPaymentData.payAmount}
        trackId={cryptoPaymentData.trackId}
        orderId={cryptoPaymentData.orderId}
        currency={selectedCryptoCoin || 'BTC'}
        fiatAmount={finalAmount}
        onClose={() => setCryptoPaymentData(null)}
        onSuccess={() => {
          setCryptoPaymentData(null);
          router.push(`/order/${cryptoPaymentData.orderId}`);
        }}
      />
    )}
    </>
  );
}
