"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, LayoutGrid, Plus, User as UserIcon, Lock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import ToolDownloadButton from "./ToolDownloadButton";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isBanned, setIsBanned] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfileData = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("balance, is_admin, is_banned, display_name, avatar_url")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data);
      setBalance(Number(data.balance));
      setIsAdmin(!!data.is_admin);
      setIsBanned(!!data.is_banned);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfileData(session.user.id);
    });

    const handleBalanceUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchProfileData(session.user.id);
      });
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, []);

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    window.location.reload();
  };

  return (
    <nav className="border-b border-white/5 bg-[#0a0a0a]/30 backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="text-xl font-bold tracking-tight text-white flex items-center gap-3"
        >
          <img src="/logo.png" alt="LarpSenseStore Logo" className="h-8 w-auto object-contain drop-shadow-md" />
          <div className="flex items-baseline">
            <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">LarpSense</span>
            <span className="font-light tracking-wide text-gray-400 ml-1">Store</span>
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* GitHub Download Tool Button */}
          <ToolDownloadButton />

          {/* Balance Pill or Banned Pill */}
          {user && (
            isBanned ? (
              <div className="flex items-center bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-full px-4 h-10 shadow-lg text-red-500 font-bold text-xs uppercase tracking-widest gap-2">
                <Shield className="w-4 h-4" /> Banned
              </div>
            ) : (
              <div className="flex items-center bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-full p-1 h-10 shadow-lg">
                <button 
                  onClick={() => window.dispatchEvent(new Event('open-topup'))}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 transition-all group"
                  title="Top Up Balance"
                >
                  <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </button>
                <div className="flex items-center gap-2 pl-3 pr-4 text-sm text-white font-medium">
                  <span className="font-mono tracking-tight text-gray-200">€{balance.toFixed(2)}</span>
                </div>
              </div>
            )
          )}

          {user ? (
            <div className="relative">
              {/* User Pill Button */}
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center bg-[#141414]/80 hover:bg-[#1f1f1f]/80 backdrop-blur-md border border-white/10 rounded-full p-1 h-10 pl-1.5 shadow-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 mr-2 rounded-full pr-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {user.email?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white leading-none truncate max-w-[120px]">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                  <div className="absolute top-full right-0 mt-3 w-56 bg-[#141414] border border-white/10 rounded-3xl p-2 shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50">
                    <div className="px-3 py-3 border-b border-white/5 mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-none mb-1 truncate">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <Link href="/dashboard?tab=profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      Dashboard Profile
                    </Link>
                    
                    <Link href="/dashboard?tab=orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <LayoutGrid className="w-4 h-4 text-gray-400" />
                      My Orders
                    </Link>

                    <Link href="/dashboard?tab=security" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <Lock className="w-4 h-4 text-gray-400" />
                      Security Settings
                    </Link>

                    {isAdmin && (
                      <Link href="/admin" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="h-[1px] bg-white/5 my-2 mx-2"></div>
                    
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutConfirm(true);
                      }} 
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4" />
                        Log out
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Logout Popover */}
              {showLogoutConfirm && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-[#141414] border border-white/10 rounded-3xl p-3 shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50">
                  <p className="text-sm text-gray-300 mb-3 text-center font-medium">Log out of account?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowLogoutConfirm(false)} 
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmSignOut} 
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => window.dispatchEvent(new Event('open-auth'))} 
              className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ml-2"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

    </nav>
  );
}
