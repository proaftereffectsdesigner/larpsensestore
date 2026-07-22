"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { Copy, Search, RefreshCw, Lock, Package, KeyRound, Wallet, Plus, Eye, EyeOff, TrendingUp } from "lucide-react";
import { products } from "@/lib/products";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [checkingIdx, setCheckingIdx] = useState<{orderId: string, idx: number} | null>(null);
  const [replacingIdx, setReplacingIdx] = useState<{orderId: string, idx: number} | null>(null);
  const [revealedIdx, setRevealedIdx] = useState<{orderId: string, idx: number} | null>(null);

  const router = useRouter();

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
  };

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();
    if (data) setBalance(Number(data.balance));
  };

  const loadDashboardData = async (userId: string) => {
    await Promise.all([fetchOrders(userId), fetchBalance(userId)]);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      loadDashboardData(session.user.id);
    });

    const handleBalanceUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchBalance(session.user.id);
      });
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, [router]);

  const handlePasswordResetRequest = async () => {
    if (!user?.email) return;
    setPasswordUpdating(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    setPasswordUpdating(false);
    
    if (error) {
      alert("Failed to send reset email: " + error.message);
    } else {
      alert("Password reset email sent! Please check your inbox.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleCheck = async (accountStr: string, orderId: string, idx: number) => {
    setCheckingIdx({ orderId, idx });
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStr }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert(`Status: ${data.status}\\nMessage: ${data.message || 'Account looks good!'}`);
      } else {
        alert("Check failed: " + data.error);
      }
    } catch (err) {
      alert("Error checking account.");
    } finally {
      setCheckingIdx(null);
    }
  };

  const handleReplace = async (accountStr: string, orderId: string, idx: number) => {
    if (!confirm("Are you sure you want to replace this account? You can only replace bad accounts within 6 hours of purchase.")) return;
    
    setReplacingIdx({ orderId, idx });
    try {
      const res = await fetch("/api/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStr, orderId, accountIdx: idx }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert("Account replaced successfully!");
        if (user) loadDashboardData(user.id);
      } else {
        alert("Replacement failed: " + data.error);
      }
    } catch (err) {
      alert("Error processing replacement.");
    } finally {
      setReplacingIdx(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalSpent = orders.reduce((acc, order) => acc + Number(order.total_price), 0);
  const totalOrders = orders.length;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 w-full relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Your Dashboard</h1>
          <p className="text-[#a1a1aa]">Welcome back, <span className="text-white font-medium">{user.email}</span></p>
        </div>
      </div>

      <div className="flex flex-col gap-8">

        {/* Sekcja Głośnych Kafelków */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Statystyki */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-gray-400 text-sm font-medium">Total Spent</p>
            </div>
            <p className="text-3xl font-bold text-white font-mono mb-1">€{totalSpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500 font-medium">{totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'} Completed</p>
          </div>

          {/* Sekcja Balansu */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <Wallet className="w-40 h-40" />
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Wallet className="w-5 h-5 text-white" />
              <p className="text-gray-400 text-sm font-medium">Available Funds</p>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <p className="text-3xl font-bold text-white font-mono">€{balance.toFixed(2)}</p>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-topup'))}
                className="bg-white hover:bg-gray-200 text-black font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Top Up
              </button>
            </div>
          </div>
          
        </div>
        
        {/* Sekcja Zamówień */}
        <div className="space-y-6 mt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Purchase History
          </h2>
          
          {orders.length === 0 ? (
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
              <p className="text-gray-400 mb-6">Looks like you haven't bought anything yet.</p>
              <Link href="/" className="bg-white text-black font-semibold rounded-lg px-6 py-2.5 hover:bg-gray-200 transition-colors">
                Browse Store
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 space-y-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar shadow-2xl">
                {orders.map((order) => {
                  const pInfo = products.find(p => p.id === order.product_id);
                  const accounts = order.accounts_data ? order.accounts_data.split("\\n") : [];
                  
                  return (
                    <div key={order.id} className="border-b border-white/10 pb-8 last:border-0 last:pb-0 relative">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-accent mb-1">Counter Strike 2</div>
                          <div className="font-medium text-white text-lg">{pInfo?.name || order.product_id}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">#{order.id.split('-')[0]} • {new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-white text-xl font-medium">€{Number(order.total_price).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {accounts.map((acc: string, idx: number) => {
                          const isChecking = checkingIdx?.orderId === order.id && checkingIdx?.idx === idx;
                          const isReplacing = replacingIdx?.orderId === order.id && replacingIdx?.idx === idx;
                          const isRevealed = revealedIdx?.orderId === order.id && revealedIdx?.idx === idx;
                          
                          return (
                            <div key={idx} className="group flex flex-col md:flex-row items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.04] -mx-4 px-4 transition-colors rounded-xl">
                              <div className={`font-mono text-gray-300 break-all text-sm w-full transition-all duration-300 ${!isRevealed ? 'blur-[4px] select-none opacity-50' : ''}`}>
                                {acc}
                              </div>
                              <div className="flex gap-1 w-full md:w-auto flex-wrap md:flex-nowrap opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    if (isRevealed) setRevealedIdx(null);
                                    else setRevealedIdx({ orderId: order.id, idx });
                                  }}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-gray-400 hover:text-white px-2 py-1.5 rounded-md text-xs transition-colors bg-white/5 md:bg-transparent hover:bg-white/10"
                                >
                                  {isRevealed ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Reveal</>}
                                </button>
                                <button 
                                  onClick={() => copyToClipboard(acc)}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-gray-400 hover:text-white px-2 py-1.5 rounded-md text-xs transition-colors bg-white/5 md:bg-transparent hover:bg-white/10"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Copy
                                </button>
                                <button 
                                  onClick={() => handleCheck(acc, order.id, idx)}
                                  disabled={isChecking}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-blue-400/70 hover:text-blue-400 px-2 py-1.5 rounded-md text-xs transition-colors bg-blue-500/10 md:bg-transparent hover:bg-blue-500/20 disabled:opacity-50"
                                >
                                  {isChecking ? <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <><Search className="w-3.5 h-3.5" /> Check</>}
                                </button>
                                <button 
                                  onClick={() => handleReplace(acc, order.id, idx)}
                                  disabled={isReplacing}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-red-400/70 hover:text-red-400 px-2 py-1.5 rounded-md text-xs transition-colors bg-red-500/10 md:bg-transparent hover:bg-red-500/20 disabled:opacity-50"
                                >
                                  {isReplacing ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <><RefreshCw className="w-3.5 h-3.5" /> Replace</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sekcja Ustawień */}
        <div className="space-y-6 mt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Security Settings
          </h2>
          
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-accent" />
              Change Password
            </h3>
            
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              We will send a secure password reset link directly to your email address ({user.email}).
            </p>

            <button 
              onClick={handlePasswordResetRequest}
              disabled={passwordUpdating}
              className="w-full bg-white/5 border border-white/10 text-white font-medium rounded-lg px-4 py-3 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {passwordUpdating ? "Sending..." : "Send Password Reset Email"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
