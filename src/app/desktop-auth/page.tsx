"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Loader2 } from "lucide-react";

export default function DesktopAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      // Small delay for UI smoothness, then redirect to the desktop app local server
      const { access_token, refresh_token } = session;
      const timeout = setTimeout(() => {
        window.location.href = `http://127.0.0.1:54321/callback?access_token=${access_token}&refresh_token=${refresh_token}`;
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [session]);

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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="bg-[#0f0f0f] border border-accent/20 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Authorizing...</h1>
        <p className="text-gray-400 text-sm">
          Redirecting to LarpSense NFA Tool.<br/>
          You can close this window once the app opens.
        </p>
      </div>
    </div>
  );
}
