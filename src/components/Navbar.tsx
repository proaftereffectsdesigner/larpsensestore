"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, LogOut, LayoutGrid, Plus, User as UserIcon, Lock, Shield, AlertTriangle, MessageSquare, Star, Bell, X, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import CurrencySelector from "./CurrencySelector";
import { useCurrency } from "@/lib/CurrencyContext";
import MiniPumpkin from "./halloween/MiniPumpkin";

const MEGA_MENUS: Record<string, { title: string, bigLinks?: boolean, links: { label: string, href: string }[] }[]> = {
  "CS2": [
    {
      title: "Explore CS2",
      bigLinks: true,
      links: [
        { label: "Every CS2 Product", href: "/shop?category=cs2" },
        { label: "Prime Accounts", href: "/product/prime" },
        { label: "Premier Accounts", href: "/product/premier" },
      ]
    },
    {
      title: "Medals & Rating",
      links: [
        { label: "Premier (4+ Medals)", href: "/product/premier-4-medals" },
        { label: "Premier (10+ Medals)", href: "/product/premier-10-medals" },
        { label: "Premier (10k Rating)", href: "/product/premier-10k" },
        { label: "Premier (15k Rating)", href: "/product/premier-15k" },
        { label: "Premier (20k Rating)", href: "/product/premier-20k" },
      ]
    },
    {
      title: "More from CS2",
      links: [
        { label: "Premier (Knife/Glove)", href: "/product/premier-rare" },
        { label: "Inactive Accounts", href: "/product/premier-inactive" }
      ]
    }
  ],
  "Rust": [
    {
      title: "Explore Rust",
      bigLinks: true,
      links: [
        { label: "Every Rust Product", href: "/shop?category=rust" },
        { label: "Starter Accounts", href: "/product/rust-1-99" },
        { label: "Veteran Accounts", href: "/product/rust-1000-plus" },
      ]
    },
    {
      title: "Shop by Hours",
      links: [
        { label: "Rust 1-100 Hours", href: "/product/rust-1-99" },
        { label: "Rust 100-200 Hours", href: "/product/rust-100-199" },
        { label: "Rust 200-500 Hours", href: "/product/rust-200-499" },
        { label: "Rust 500-1000 Hours", href: "/product/rust-500-999" },
        { label: "Rust 1000+ Hours", href: "/product/rust-1000-plus" },
      ]
    }
  ],
  "Extra": [
    {
      title: "Explore Extra",
      bigLinks: true,
      links: [
        { label: "Every Extra Product", href: "/shop?category=extra" },
      ]
    },
    {
      title: "Shop Extra",
      links: [
        { label: "Rainbow Six Siege", href: "/product/r6" },
        { label: "DayZ", href: "/product/dayz" },
        { label: "Battlefield 6", href: "/product/bf6" },
      ]
    }
  ],
  "Shop": [
    {
      title: "Explore Shop",
      bigLinks: true,
      links: [
        { label: "Every Product", href: "/shop" },
      ]
    },
    {
      title: "Categories",
      links: [
        { label: "CS2 Accounts", href: "/shop?category=cs2" },
        { label: "Rust Accounts", href: "/shop?category=rust" },
        { label: "Extra Accounts", href: "/shop?category=extra" }
      ]
    }
  ],
  "Support": [
    {
      title: "Customer Service",
      bigLinks: true,
      links: [
        { label: "Open a Support Ticket", href: "/support/ticket" }
      ]
    },
    {
      title: "Get Help",
      links: [
        { label: "Invalid / Expired Token", href: "/support/ticket?type=token" },
        { label: "Order not delivered", href: "/support/ticket?type=order" },
        { label: "Payment Issue / Top-up failed", href: "/support/ticket?type=payment" },
        { label: "General Question", href: "/support/ticket?type=general" },
        { label: "Other", href: "/support/ticket?type=other" }
      ]
    },
    {
      title: "Partnerships",
      bigLinks: true,
      links: [
        { label: "Affiliate Program", href: "/support/affiliate" }
      ]
    },
    {
      title: "Helpful Topics",
      links: [
        { label: "Why can't I log into my account?", href: "/faq" },
        { label: "How to keep the account alive longer?", href: "/faq" }
      ]
    }
  ]
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [announcement, setAnnouncement] = useState<{ text: string, color: string } | null>(null);
  
  // Mega Menu State
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [renderedMenu, setRenderedMenu] = useState<string | null>(null);
  const [menuHeight, setMenuHeight] = useState<number>(0);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (activeMegaMenu && menuRefs.current[activeMegaMenu]) {
      setMenuHeight(menuRefs.current[activeMegaMenu]?.offsetHeight || 0);
    } else if (!activeMegaMenu) {
      timeout = setTimeout(() => setRenderedMenu(null), 300);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [activeMegaMenu]);

  const handleMenuEnter = (menu: string) => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setActiveMegaMenu(menu);
    setRenderedMenu(menu);
  };

  const handleMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

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
        }, 60000);

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
      <nav className={`border-b border-white/5 w-full relative transition-colors duration-300 ${activeMegaMenu && (MEGA_MENUS as any)[activeMegaMenu] ? 'bg-[#0a0a0a]' : 'bg-[#161617]/80 backdrop-blur-md backdrop-saturate-150'}`} onMouseLeave={handleMenuLeave}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between w-full">
          
          <Link 
            href="/" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center shrink-0 relative group"
            onMouseEnter={() => handleMenuEnter('Home')}
          >
            <img src="/logo.png" alt="LarpSenseStore Logo" className="h-6 w-auto object-contain hover:opacity-80 transition-opacity" />
            <MiniPumpkin className="w-4 h-4 ml-1.5 -mt-2.5 rotate-12 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-0" />
          </Link>
          
          {["Shop", "CS2", "Rust", "Extra", "Support", "FAQ", "Tool", "Rewards"].map(item => (
            <Link 
              key={item}
              href={item === "Shop" ? "/shop" : item === "Rewards" ? "/rewards/card" : item === "Support" ? "/support" : item === "FAQ" ? "/faq" : item === "Tool" ? "/tool" : item === "CS2" ? "/shop?category=cs2" : item === "Rust" ? "/shop?category=rust" : item === "Extra" ? "/shop?category=extra" : "/shop"} 
              className={`hidden md:block text-[13px] tracking-tight antialiased transition-colors ${item === "Rewards" ? 'font-medium text-accent hover:text-emerald-400' : pathname === (item === "Shop" ? "/shop" : item === "Support" ? "/support" : item === "FAQ" ? "/faq" : item === "Tool" ? "/tool" : "/shop") ? 'text-white font-normal' : 'text-[#f5f5f7]/80 hover:text-white font-normal'}`}
              onMouseEnter={() => handleMenuEnter(item)}
              onClick={() => {
                setActiveMegaMenu(null);
                setRenderedMenu(null);
              }}
            >
              {item}
            </Link>
          ))}

        {/* Right: Controls */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <CurrencySelector />
          
          {/* Balance Pill or Banned Pill */}
          {user && (
            isBanned ? (
              <div className="flex items-center text-red-500 font-bold text-xs uppercase tracking-widest gap-1.5 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5" /> Banned
              </div>
            ) : (
              <button 
                onClick={() => window.dispatchEvent(new Event('open-topup'))}
                className="flex items-center gap-2 h-8 px-2 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-white group shrink-0"
                title="Top Up Balance"
              >
                <Plus className="w-3.5 h-3.5 text-[#48c931] group-hover:scale-110 transition-transform" />
                <span className="font-mono text-sm tracking-tight font-medium transition-colors" title={`€${balance.toFixed(2)}`}>
                  {convert(balance).formatted}
                </span>
              </button>
            )
          )}

          {/* Notifications Bell */}
          {user && (
            <div ref={notificationsRef} className="relative h-8 flex items-center">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors group"
              >
                <Bell className={`w-4 h-4 transition-colors`} />
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
                              href={ticket.issue_type === 'affiliate_application' ? '/support/affiliate' : '/support'}
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



          {user ? (
            <div 
              ref={dropdownRef} 
              className="relative h-8 flex items-center group"
            >
              {/* User Pill Button */}
              <Link 
                href="/dashboard"
                onClick={() => setShowDropdown(false)}
                className="flex items-center hover:bg-white/5 rounded h-8 px-2 transition-colors text-gray-400 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  {profile?.avatar_url ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <UserIcon className="w-4 h-4 transition-colors" />
                  )}
                  <span className="text-sm font-medium leading-none truncate max-w-[100px] transition-colors">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                </div>
              </Link>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 pt-2 w-56 z-50 opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-[#111] border border-white/5 rounded-[16px] p-1.5 shadow-2xl">
                    <div className="px-3 py-3 border-b border-white/5 mb-1.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white leading-tight truncate">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <Link href="/dashboard?tab=profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <UserIcon className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      Dashboard Profile
                    </Link>
                    
                    <Link href="/dashboard?tab=orders" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <LayoutGrid className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      My Orders
                    </Link>

                    <Link href="/dashboard?tab=tickets" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <MessageSquare className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      Support Tickets
                    </Link>

                    <Link href="/dashboard?tab=reviews" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <Star className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      My Reviews
                    </Link>

                    <Link href="/support/affiliate" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <UserPlus className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      Affiliate Program
                    </Link>

                    <Link href="/dashboard?tab=security" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-[10px] transition-colors group">
                      <Lock className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                      Security Settings
                    </Link>

                    {isAdmin && (
                      <Link href="/7evenejoyer" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-[10px] transition-colors group mt-1">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="h-[1px] bg-white/5 my-1.5 mx-2"></div>
                    
                    <button 
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutConfirm(true);
                      }} 
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-[10px] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4" />
                        Log out
                      </div>
                    </button>
                  </div>
                </div>

              {/* Logout Popover */}
              {showLogoutConfirm && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-[#111] border border-white/5 rounded-[16px] p-2 shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50">
                  <p className="text-[13px] text-white/60 mb-3 text-center font-medium px-2">Log out of account?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowLogoutConfirm(false)} 
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-[10px] text-[12px] font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmSignOut} 
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-[10px] text-[12px] font-semibold transition-colors"
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
              className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors ml-2"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      </nav>

      {/* Backdrop Overlay */}
      <div 
        className={`absolute top-[100%] left-0 w-full h-[100vh] bg-black/40 backdrop-blur-md z-30 transition-opacity duration-300 ease-in-out ${
          activeMegaMenu && MEGA_MENUS[activeMegaMenu] ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={handleMenuLeave}
      />

      {/* Mega Menu Dropdown */}
      <div 
        className="absolute top-[100%] left-0 w-full bg-[#0a0a0a] border-b border-neutral-800 shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: activeMegaMenu && MEGA_MENUS[activeMegaMenu] ? `${menuHeight}px` : '0px',
          opacity: activeMegaMenu && MEGA_MENUS[activeMegaMenu] ? 1 : 0,
          borderBottomColor: activeMegaMenu && MEGA_MENUS[activeMegaMenu] ? '#262626' : 'transparent'
        }}
        onMouseEnter={() => { if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current); }}
        onMouseLeave={handleMenuLeave}
      >
        <div className="relative w-full max-w-5xl mx-auto h-full">
          {Object.entries(MEGA_MENUS).map(([menuName, columns]) => (
            <div 
              key={menuName}
              ref={(el) => { if (el) menuRefs.current[menuName] = el; }}
              className={`absolute top-0 left-0 w-full px-4 py-8 flex gap-16 lg:gap-24 transition-opacity duration-300 ease-in-out ${
                activeMegaMenu === menuName || renderedMenu === menuName && !activeMegaMenu
                  ? 'opacity-100 pointer-events-auto delay-75' 
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {columns.map((col, colIndex) => (
                <div key={col.title} className="flex flex-col gap-4">
                  <h3 
                    className={`text-xs text-[#f5f5f7]/50 font-medium uppercase tracking-wider transition-all duration-500 ease-out ${
                      activeMegaMenu === menuName ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                    }`}
                    style={{ transitionDelay: activeMegaMenu === menuName ? `${50 + (colIndex * 20)}ms` : '0ms' }}
                  >
                    {col.title}
                  </h3>
                  <div className={`flex flex-col ${col.bigLinks ? 'gap-4' : 'gap-3'}`}>
                    {col.links.map((link, index) => (
                      <Link 
                        key={link.label} 
                        href={link.href} 
                        className={`${col.bigLinks ? 'text-[24px] font-semibold text-[#f5f5f7]' : 'text-[13px] font-semibold tracking-tight text-[#f5f5f7]/90'} hover:text-white transition-all duration-500 ease-out ${
                          activeMegaMenu === menuName ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                        }`}
                        style={{ transitionDelay: activeMegaMenu === menuName ? `${100 + (colIndex * 20) + (index * 30)}ms` : '0ms' }}
                        onClick={() => {
                          setActiveMegaMenu(null);
                          setRenderedMenu(null);
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
