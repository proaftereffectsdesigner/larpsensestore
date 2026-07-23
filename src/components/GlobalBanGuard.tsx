"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";

export default function GlobalBanGuard() {
  const [isBanned, setIsBanned] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [banAcknowledged, setBanAcknowledged] = useState(true);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [banExpiresAt, setBanExpiresAt] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<any>({});
  const pathname = usePathname();

  useEffect(() => {
    const checkBan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("is_banned, ban_acknowledged, ban_reason, ban_expires_at, can_topup, can_purchase, can_update_profile")
        .eq("id", session.user.id)
        .single();
        
      if (data) {
        setIsBanned(data.is_banned === true);
        const restricted = !data.is_banned && (data.can_topup === false || data.can_purchase === false || data.can_update_profile === false);
        setIsRestricted(restricted);
        setBanAcknowledged(data.ban_acknowledged !== false);
        setBanReason(data.ban_reason);
        setBanExpiresAt(data.ban_expires_at);
        setRestrictions({
          can_topup: data.can_topup,
          can_purchase: data.can_purchase,
          can_update_profile: data.can_update_profile
        });
      }
    };
    
    checkBan();
    
    // Also listen for presence updates to re-check ban status dynamically
    const interval = setInterval(checkBan, 10000); // Check every 10s just in case
    return () => clearInterval(interval);
  }, [pathname]);

  const handleAcknowledgeBan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch("/api/user/acknowledge-ban", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        setBanAcknowledged(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if ((!isBanned && !isRestricted) || banAcknowledged) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`bg-[#0a0a0a] border ${isBanned ? 'border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.2)]' : 'border-orange-500/30 shadow-[0_0_100px_rgba(249,115,22,0.2)]'} rounded-3xl overflow-hidden w-full max-w-lg relative`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 ${isBanned ? 'bg-red-500/20' : 'bg-orange-500/20'} rounded-full blur-[80px] pointer-events-none`}></div>
        
        <div className="p-8 pb-6 relative z-10 text-center">
          <div className={`w-20 h-20 ${isBanned ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'} rounded-full flex items-center justify-center mx-auto mb-6 border-4 shadow-inner`}>
            <ShieldAlert className={`w-10 h-10 ${isBanned ? 'text-red-500' : 'text-orange-500'}`} />
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
            {isBanned ? 'Account Suspended' : 'Account Restricted'}
          </h2>
          <p className={`${isBanned ? 'text-red-400' : 'text-orange-400'} font-medium text-lg`}>
            {isBanned ? 'Your account access has been fully restricted.' : 'Some features have been disabled on your account.'}
          </p>
        </div>

        <div className="px-8 space-y-6 relative z-10">
          <div className="bg-[#141414] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            
            <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Expiration</span>
              <span className="text-sm font-bold text-white">
                {banExpiresAt ? new Date(banExpiresAt).toLocaleString() : 'Permanent'}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Reason provided by Administrator:</h3>
              <div className={`${isBanned ? 'bg-red-500/5 border-red-500/10' : 'bg-orange-500/5 border-orange-500/10'} border p-5 rounded-xl`}>
                <p className="text-white text-lg font-medium italic">"{banReason || 'No specific reason was provided. Contact support for details.'}"</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-2">Current Restrictions:</h3>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                {isBanned || restrictions.can_purchase === false ? <li>You cannot purchase products or services.</li> : null}
                {isBanned || restrictions.can_topup === false ? <li>You cannot add funds to your wallet.</li> : null}
                {isBanned || restrictions.can_update_profile === false ? <li>You cannot modify your public profile information.</li> : null}
                {!isBanned && <li>You can still browse the store and view your previous orders.</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="p-8 bg-[#0a0a0a] flex flex-col items-center gap-4 mt-6">
          <button 
            onClick={handleAcknowledgeBan}
            className={`w-full py-4 rounded-xl ${isBanned ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]'} text-white font-black text-lg transition-all hover:scale-[1.02]`}
          >
            I Understand
          </button>
          <p className="text-xs text-gray-500 font-medium text-center">By clicking this button, you acknowledge that you have read this notice. This warning will not appear again until your status changes.</p>
        </div>
      </div>
    </div>
  );
}
