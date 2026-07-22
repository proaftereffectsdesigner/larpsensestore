"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, LayoutGrid, Plus, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const fetchBalance = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();
    if (data) setBalance(Number(data.balance));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBalance(session.user.id);
    });

    const handleBalanceUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchBalance(session.user.id);
      });
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="border-b border-white/5 bg-[#0a0a0a]/30 backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
          <img src="/logo.png" alt="LarpSenseStore Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <div className="flex items-baseline">
            <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">LarpSense</span>
            <span className="font-light tracking-wide text-gray-400 ml-1">Store</span>
          </div>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:inline-block">
                {user.email}
              </span>
              <button 
                onClick={handleSignOut}
                className="text-sm text-red-400/80 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline-block">Logout</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#141414] border border-white/10 rounded-full p-1 h-10">
              <button 
                onClick={() => window.dispatchEvent(new Event('open-topup'))}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Top Up Balance"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-2 pl-2 pr-3 text-sm text-white font-medium">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-mono">€{balance.toFixed(2)}</span>
              </div>
            </div>
            {user && (
              <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-[#141414] hover:bg-white/10 transition-colors border border-white/10" title="Dashboard">
                <UserIcon className="w-4 h-4 text-gray-400" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
