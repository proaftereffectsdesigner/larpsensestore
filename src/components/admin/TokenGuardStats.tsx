import { Shield, Activity, KeyRound, AlertTriangle } from "lucide-react";

export default function TokenGuardStats({ data }: { data: any }) {
  if (!data) return null;

  const tokenGuard = data?.advanced?.tokenGuard;

  if (!tokenGuard) return null;

  return (
    <div className="bg-[#111] border border-accent/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-8 -mt-8 blur-2xl"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-white font-bold">LarpSense NFA Tool Status</h3>
          <p className="text-xs text-gray-500">System Health & API limits</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-400">Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-black/50 border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Activity className="w-4 h-4 text-blue-400" /> API Limits
          </div>
          <p className="text-2xl font-black text-white">{tokenGuard.apiRateLimit}</p>
          <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '90%' }}></div>
          </div>
        </div>

        <div className="bg-black/50 border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
            <KeyRound className="w-4 h-4 text-emerald-400" /> Auths (24h)
          </div>
          <p className="text-2xl font-black text-white">{tokenGuard.auths24h.toLocaleString()}</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+12% vs yesterday</p>
        </div>

        <div className="bg-black/50 border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" /> Decrypt Errors
          </div>
          <p className="text-2xl font-black text-white">{tokenGuard.decryptionErrors}</p>
          <p className="text-xs text-gray-500 font-bold mt-1">DPAPI / Win32Crypt</p>
        </div>
      </div>
    </div>
  );
}
