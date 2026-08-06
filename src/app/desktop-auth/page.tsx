"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Loader2, LogOut, CheckCircle2, User as UserIcon } from "lucide-react";

export default function DesktopAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // When profile is fetched (or session is null), we can stop loading
    if (session && profile) {
      setLoading(false);
    }
  }, [session, profile]);

  const handleContinue = () => {
    if (!session) return;
    setIsRedirecting(true);
    const { access_token, refresh_token } = session;
    // Direct redirect without setTimeout to preserve user gesture context (fixes browser blocks)
    window.location.assign(`http://127.0.0.1:54321/callback?access_token=${access_token}&refresh_token=${refresh_token}`);
  };

  const handleChangeAccount = () => {
    // DO NOT sign out immediately! Just open the auth modal.
    // If they log in, Supabase will override the session.
    // If they close the modal, they stay logged in with their current account.
    window.dispatchEvent(new CustomEvent("open-auth"));
  };

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent("open-auth"));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
        <div className="bg-[#0f0f0f] border border-accent/20 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Authorizing...</h1>
          <p className="text-gray-400 text-sm mb-4">
            Redirecting to LarpSense NFA Tool.<br/>
            You can close this window once the app opens.
          </p>
          <p className="text-gray-500 text-xs">
            If nothing happens, <a href={`http://127.0.0.1:54321/callback?access_token=${session?.access_token}&refresh_token=${session?.refresh_token}`} className="text-accent underline">click here to continue manually</a>.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
          <img src="/logo.png" alt="LarpSense Logo" className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Connect Desktop App</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            You need to log in to authorize the LarpSense NFA Tool to access your accounts.
          </p>
          
          <button 
            onClick={handleOpenAuth}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02]"
          >
            Login or Sign up
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || session.user?.email?.split('@')[0];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        
        {profile?.avatar_url ? (
          <div className="relative w-20 h-20 mx-auto mb-6">
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-accent/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]" />
            <div className="absolute bottom-0 right-0 bg-accent text-black rounded-full p-1 border-2 border-[#0f0f0f]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.15)] relative">
            <UserIcon className="w-10 h-10 text-accent" />
            <div className="absolute bottom-0 right-0 bg-accent text-black rounded-full p-1 border-2 border-[#0f0f0f]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Account Detected</h1>
        <p className="text-gray-400 mb-2 text-sm leading-relaxed">
          You are currently logged in as:
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-8">
          <span className="font-bold text-white text-lg">{displayName}</span>
          <div className="text-gray-500 text-xs mt-1">{session.user?.email}</div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={handleContinue}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Continue as {displayName}
          </button>
          
          <button 
            onClick={handleChangeAccount}
            className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold py-4 rounded-xl transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
