"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, LogOut, LayoutGrid, Plus, User as UserIcon, Lock, Shield, AlertTriangle, MessageSquare, Star, Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import ToolDownloadButton from "./ToolDownloadButton";
import CurrencySelector from "./CurrencySelector";
import { useCurrency } from "@/lib/CurrencyContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string, color: string } | null>(null);

  const [isBanned, setIsBanned] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadTickets, setUnreadTickets] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { convert } = useCurrency();

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
      if (session?.user) {
        fetchProfileData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileData(session.user.id);
      }
    });

    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.announcement_text) {
            setAnnouncement({ text: data.announcement_text, color: data.announcement_color });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnnouncement();

    const handleBalanceUpdate = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchProfileData(session.user.id);
      });
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    // Initial unread check
    const checkUnread = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('tickets')
          .select('id, ticket_number, issue_type')
          .eq('user_id', userId)
          .eq('status', 'open')
          .eq('has_unread', true);
        setUnreadTickets(data || []);
      } catch (err) {
        // column might not exist yet, ignore silently
      }
    };

    let channel: any = null;
    let pollInterval: NodeJS.Timeout;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUnread(session.user.id);
        
        // Polling fallback w razie braku włączonego Supabase Realtime na tabeli tickets
        pollInterval = setInterval(() => {
          checkUnread(session.user.id);
        }, 3000);

        channel = supabase.channel('realtime:tickets_unread')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `user_id=eq.${session.user.id}` }, () => {
            checkUnread(session.user.id);
          })
          .subscribe();
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      if (channel) supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Wymuszone czyszczenie hasha (Next.js lubi przywracać hash z cache routera po powrocie np. z podstrony /support do /)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('access_token=') || hash === '#' || hash === '') {
        // Only strip if there's actually a trailing '#' in the raw URL
        if (window.location.href.endsWith('#') || hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showDropdown || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown, showNotifications]);

  const clearNotification = async (ticketId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await supabase.from('tickets').update({ has_unread: false }).eq('id', ticketId);
      setUnreadTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const ids = unreadTickets.map(t => t.id);
      if (ids.length === 0) return;
      await supabase.from('tickets').update({ has_unread: false }).in('id', ids);
      setUnreadTickets([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         await fetch("/api/auth/log-session", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "Authorization": `Bearer ${session.access_token}`
           },
           body: JSON.stringify({ action: "logout" })
         });
      }
    } catch (e) {
      console.error(e);
    }
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
      {announcement && announcement.text && (
        <div className={`border-b py-3 px-4 flex items-center justify-center gap-3 text-sm md:text-base font-bold shadow-lg backdrop-blur-xl ${
          announcement.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
          announcement.color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
          announcement.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' :
          'bg-amber-500/10 border-amber-500/20 text-amber-200'
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 ${
            announcement.color === 'red' ? 'text-red-400' :
            announcement.color === 'green' ? 'text-green-400' :
            announcement.color === 'yellow' ? 'text-yellow-400' :
            'text-amber-400'
          }`} />
          <p>{announcement.text}</p>
        </div>
      )}
      <nav className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-2xl w-full">
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
        
        <div className="hidden md:flex items-center gap-6 ml-6 mr-auto">
          <Link 
            href="/" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link href="/support" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Support</Link>
          <Link href="/faq" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">FAQ</Link>

        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Notifications Bell used to be here */}

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
                  <span className="font-mono tracking-tight text-gray-200" title={`€${balance.toFixed(2)}`}>
                    {convert(balance).formatted}
                  </span>
                </div>
              </div>
            )
          )}

          {user ? (
            <div ref={dropdownRef} className="relative">
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

                    <Link href="/dashboard?tab=tickets" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      Support Tickets
                    </Link>

                    <Link href="/dashboard?tab=reviews" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <Star className="w-4 h-4 text-gray-400" />
                      My Reviews
                    </Link>

                    <Link href="/dashboard?tab=security" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <Lock className="w-4 h-4 text-gray-400" />
                      Security Settings
                    </Link>

                    {isAdmin && (
                      <Link href="/7evenejoyer" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
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

          {/* Notifications Bell moved to the right of User Pill */}
          {user && (
            <div ref={notificationsRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#141414]/80 hover:bg-[#1f1f1f]/80 border border-white/10 transition-colors shadow-lg group"
              >
                <Bell className={`w-5 h-5 ${unreadTickets.length > 0 ? 'text-white' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                {unreadTickets.length > 0 && (
                  <>
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#0a0a0a] rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none z-10">
                      {unreadTickets.length}
                    </span>
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></span>
                  </>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute top-full right-0 mt-3 w-72 bg-[#141414] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-2">
                      <span className="text-sm font-bold text-white">Notifications</span>
                      {unreadTickets.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {unreadTickets.length === 0 ? (
                        <div className="py-6 text-center">
                          <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No new notifications</p>
                        </div>
                      ) : (
                        unreadTickets.map(ticket => (
                          <div key={ticket.id} className="relative group">
                            <Link
                              href={ticket.issue_type === 'affiliate_application' ? '/dashboard?tab=affiliate' : '/support'}
                              onClick={() => {
                                if (ticket.issue_type !== 'affiliate_application') {
                                  localStorage.setItem('larpsense_ticket_session', ticket.ticket_number.toString());
                                }
                                setShowNotifications(false);
                                clearNotification(ticket.id, { preventDefault: () => {}, stopPropagation: () => {} } as any);
                              }}
                              className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors pr-10"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-xs font-bold text-gray-300">New Reply in Ticket</span>
                              </div>
                              <p className="text-sm text-white font-medium truncate">Ticket #{ticket.ticket_number}</p>
                            </Link>
                            <button
                              onClick={(e) => clearNotification(ticket.id, e)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <CurrencySelector />
        </div>
      </div>

      </nav>
    </div>
  );
}
