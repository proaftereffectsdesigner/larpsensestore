"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { CheckCircle2, CreditCard, Wallet, ChevronDown, Minus, Plus, ShieldCheck, Gamepad2, Info } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function CategoryPage() {
  const { id } = useParams(); // 'prime' or 'premier'
  const router = useRouter();
  
  const categoryProducts = products.filter(p => id === "prime" ? p.id === "prime" : p.id.startsWith("premier"));
  
  const [selectedProductId, setSelectedProductId] = useState<string>(categoryProducts[0]?.id || "");
  const selectedProduct = categoryProducts.find(p => p.id === selectedProductId);

  const [stock, setStock] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "balance">("stripe");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setLoadingStock(true);
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock && data.stock.cs2) {
          const available = data.stock.cs2[selectedProduct.type]?.available || 0;
          setStock(available);
          setQuantity(1); // reset quantity when product changes
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStock(false));
  }, [selectedProduct]);

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
      router.push("/login");
      return;
    }
    if (!selectedProduct) return;

    setLoadingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

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
        router.push(data.url);
      } else {
        alert("Checkout failed: " + data.error);
        setLoadingCheckout(false);
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
          <div className={`w-full aspect-square relative flex flex-col items-center justify-center p-8 overflow-hidden rounded-3xl border border-white/5 shadow-2xl ${id === "prime" ? "bg-gradient-to-br from-indigo-900/40 to-[#111]" : "bg-gradient-to-br from-emerald-900/40 to-[#111]"}`}>
            <div className="absolute inset-0 opacity-50"><ParticlesBackground /></div>
            <Gamepad2 className="w-32 h-32 text-white/10 mb-4 relative z-10" />
            <div className="absolute top-6 left-6 z-10">
              <div className="text-xs uppercase tracking-wider font-bold bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                CS2 {id === "prime" ? "Prime" : "Premier"} Ready
              </div>
            </div>
          </div>

          {/* Opis Produktu */}
          <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-2xl text-gray-300">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Account Details
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Instant Delivery:</strong> Account credentials are sent to your email immediately after purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>No VAC Bans:</strong> Hand-verified accounts with a completely clean history.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span><strong>Full Access:</strong> You receive the login, password, and the original email address.</span>
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
        <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-8 w-full shadow-2xl relative lg:sticky lg:top-24">
          
          <h1 className="text-2xl font-bold text-white mb-8">Configure your order</h1>

          {/* Sekcja Wybór Wariantu */}
          {categoryProducts.length > 1 && (
            <div className="mb-6 z-30 relative">
              <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Select Variant</div>
              <div className="relative">
                <button 
                  onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                  className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:bg-[#222] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                    {categoryProducts.map((p) => (
                      <button 
                        key={p.id}
                        onClick={() => { setSelectedProductId(p.id); setIsVariantDropdownOpen(false); }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/5 last:border-0 ${selectedProductId === p.id ? 'bg-white/5' : ''}`}
                      >
                        <div className="text-sm text-white">{p.name}</div>
                        <div className="font-mono text-sm text-accent">€{p.price.toFixed(2)}</div>
                      </button>
                    ))}
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
            <div className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-gray-300 text-sm">
              {authChecked ? (user?.email || "Not logged in") : "Loading..."}
            </div>
          </div>

          {/* Sekcja Ilości */}
          <div className="mb-6 flex items-center justify-between bg-[#1c1c1c] border border-white/5 p-4 rounded-xl">
            <div className="text-[14px] font-bold text-white flex flex-col">
              Quantity
              <span className={`text-[10px] uppercase tracking-widest mt-1 ${stock === 0 ? 'text-red-400' : 'text-gray-500'}`}>
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
                className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:bg-[#222] transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <div className="flex items-center gap-3">
                  {paymentMethod === "stripe" ? (
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium">{paymentMethod === "stripe" ? "Stripe" : "Balance"}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  <button 
                    onClick={() => { setPaymentMethod("stripe"); setIsDropdownOpen(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-white">Stripe</span>
                  </button>
                  <button 
                    onClick={() => { setPaymentMethod("balance"); setIsDropdownOpen(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white">Balance</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Przycisk Płatności */}
          {authChecked && !user ? (
            <button 
              onClick={() => router.push("/login")}
              className="w-full bg-white text-black font-semibold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              Sign in to pay
            </button>
          ) : (
            <button 
              onClick={handleCheckout}
              disabled={loadingCheckout || loadingStock || stock === 0}
              className="w-full bg-white text-black font-semibold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
