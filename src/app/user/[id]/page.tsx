"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import ParticlesBackground from "@/components/ParticlesBackground";
import { UserIcon, ShieldCheck, Crown, Syringe, Crosshair, ShieldAlert, Unlock, Ghost, FlaskConical, Package, Gem, Zap, ArrowLeft, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { usePresence } from "@/components/PresenceTracker";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const { onlineUsers, isReady: presenceReady } = usePresence();

  useEffect(() => {
    // Force re-render periodically to recalculate 'isOnline' even if no DB update happens
    const interval = setInterval(() => setCurrentTime(new Date().getTime()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/users/${id}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile API", err);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        if (session.user?.id === id) {
          setIsOwner(true);
        }
      }
      
      setLoading(false);
    };
    fetchProfile();

    // Set up Realtime subscription for DB live status updates
    const channel = supabase
      .channel(`public:profiles:id=eq.${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new && payload.new.last_seen) {
            setProfile((prev: any) => ({ ...prev, last_seen: payload.new.last_seen }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Profile Not Found</h2>
        <p className="text-gray-400">This user does not exist or has not set up their profile.</p>
      </div>
    );
  }

  const { display_name, avatar_url, bio, last_seen, created_at, total_spent, total_orders, is_banned, banned_at } = profile;

  const accountAgeDays = Math.floor((new Date().getTime() - new Date(created_at || new Date()).getTime()) / (1000 * 3600 * 24));
  
  // Compute time badge
  let TimeIcon = Syringe;
  let timeBadge = { name: "Fresh Inject", desc: "Newcomer to the community", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", glow: "shadow-[0_0_2px_rgba(59,130,246,0.2)]" };
  if (accountAgeDays >= 365) { timeBadge = { name: "VACine Maker", desc: "Full year of elite status", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", glow: "shadow-[0_0_22px_rgba(16,185,129,0.8)]" }; TimeIcon = FlaskConical; }
  else if (accountAgeDays >= 180) { timeBadge = { name: "Undetected Legend", desc: "Legendary 6 months milestone", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", glow: "shadow-[0_0_16px_rgba(168,85,247,0.6)]" }; TimeIcon = Ghost; }
  else if (accountAgeDays >= 90) { timeBadge = { name: "Vac Bypasser", desc: "90 days of undetected presence", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", glow: "shadow-[0_0_12px_rgba(234,179,8,0.5)]" }; TimeIcon = Unlock; }
  else if (accountAgeDays >= 30) { timeBadge = { name: "Overwatch Survivor", desc: "Survived the first 30 days", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", glow: "shadow-[0_0_8px_rgba(249,115,22,0.4)]" }; TimeIcon = ShieldAlert; }
  else if (accountAgeDays >= 7) { timeBadge = { name: "Soft Aimer", desc: "Active member for a week", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", glow: "shadow-[0_0_5px_rgba(239,68,68,0.3)]" }; TimeIcon = Crosshair; }

  // Online status (Live tracking via WebSockets)
  const lastSeenDate = new Date(last_seen || created_at || new Date());
  
  // If WebSocket presence is ready, trust it 100% for instant offline.
  // If not ready yet, fallback to the 5-minute database rule.
  const isOnline = presenceReady 
    ? onlineUsers[id as string] !== undefined
    : ((currentTime - lastSeenDate.getTime()) < 5 * 60 * 1000);

  return (
    <>
      <ParticlesBackground />
      <div className="container mx-auto px-4 py-12 max-w-5xl animate-in fade-in duration-500 relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href={isLoggedIn ? "/dashboard?tab=profile" : "/"} className="w-10 h-10 rounded-full bg-[#141414] border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Public Profile
            </h2>
          </div>
          
          {isOwner && (
            <Link href="/dashboard?tab=profile" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </Link>
          )}
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative max-w-4xl mx-auto">
          {/* Banner Area */}
          <div className={`h-48 w-full bg-gradient-to-r from-[#0a0a0a] ${isOnline ? 'via-emerald-500/20' : 'via-red-500/20'} to-[#0a0a0a] relative border-b border-white/5 transition-colors duration-500`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          </div>

          <div className="px-6 md:px-10 pb-10 relative">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Avatar & Online Status */}
              <div className="flex flex-col items-center -mt-24 z-10 shrink-0 w-full md:w-48 space-y-6">
                
                <div className="relative w-48 h-48 group">
                  {/* Avatar Border & Container */}
                  <div className={`w-full h-full rounded-full overflow-hidden border-4 bg-[#0a0a0a] transition-all duration-500 ${
                    isOnline 
                      ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                      : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  }`}>
                    {avatar_url ? (
                      <img src={avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-20 h-20 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status Dot */}
                  <div 
                    title={isOnline ? "Online" : `Offline - Last seen: ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border-4 border-[#141414] ${
                      isOnline ? 'bg-emerald-500' : 'bg-red-500'
                    } flex items-center justify-center group-hover:scale-110 transition-transform cursor-help`}
                  >
                    {isOnline && <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500 opacity-30"></div>}
                  </div>
                </div>

              </div>

              {/* Right Column: Details */}
              <div className="flex-1 mt-4 md:mt-2 space-y-6">
                
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                    {display_name || "LarpSense Member"}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                    {total_spent > 50 ? (
                      <><Crown className="w-4 h-4 text-accent" /><span className="text-xs font-bold text-accent uppercase tracking-widest">Elite Buyer</span></>
                    ) : (
                      <><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Verified Member</span></>
                    )}
                  </div>
                  {is_banned ? (
                    <div className="group relative inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full mt-2 ml-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-help">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-500 uppercase tracking-widest">User Has Been Banned</span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-[#1a1a1a] border border-red-500/30 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col gap-1.5">
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1 border-b border-white/5 pb-1">Ban Details</div>
                        <div className="text-xs text-gray-300">
                          <span className="text-red-400 font-medium">Date:</span> {banned_at ? new Date(banned_at).toLocaleDateString() : 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-300 whitespace-pre-wrap">
                          <span className="text-red-400 font-medium">Reason:</span> {profile?.ban_reason || 'No specific reason provided'}
                        </div>
                        {profile?.ban_type === 'auto' && (
                          <div className="mt-1 text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded font-bold w-fit">AUTOMATIC BAN</div>
                        )}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-b border-r border-red-500/30 rotate-45"></div>
                      </div>
                    </div>
                  ) : (profile?.can_topup === false || profile?.can_purchase === false || profile?.can_update_profile === false) ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                       {profile?.can_purchase === false && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.1)] text-[10px] font-bold text-orange-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5" /> Purchases Blocked</span>}
                       {profile?.can_topup === false && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.1)] text-[10px] font-bold text-orange-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5" /> Top-ups Blocked</span>}
                       {profile?.can_update_profile === false && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.1)] text-[10px] font-bold text-orange-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5" /> Profile Locked</span>}
                    </div>
                  ) : null}
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-16 -mt-16 blur-2xl"></div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    About Me
                  </h3>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                    {bio || "This user hasn't written a bio yet."}
                  </p>
                </div>

                {/* Showcased Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Badge */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl border shrink-0 ${timeBadge.bg} ${timeBadge.glow}`}>
                      <TimeIcon className={`w-6 h-6 ${timeBadge.color}`} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Time Badge</div>
                      <div className={`font-bold text-sm ${timeBadge.color}`}>{timeBadge.name}</div>
                    </div>
                  </div>

                  {/* Top Purchase Badge */}
                  {total_orders > 0 && (
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                      {total_spent > 250 ? (
                        <>
                          <div className="p-3 rounded-xl border shrink-0 bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                            <Zap className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Spender Badge</div>
                            <div className="font-bold text-sm text-yellow-400">High Roller</div>
                          </div>
                        </>
                      ) : total_spent > 50 ? (
                        <>
                          <div className="p-3 rounded-xl border shrink-0 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                            <Gem className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Spender Badge</div>
                            <div className="font-bold text-sm text-blue-400">Elite Spender</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-xl border shrink-0 bg-accent/10 border-accent/20">
                            <Package className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Spender Badge</div>
                            <div className="font-bold text-sm text-accent">Verified Buyer</div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
