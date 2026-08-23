"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Users, Plus, Trash2, Search, CheckCircle2, ChevronDown } from "lucide-react";

export default function AffiliatesDashboard() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const router = useRouter();

  // Add state
  const [targetUserId, setTargetUserId] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [commissionPct, setCommissionPct] = useState(10);
  const [discountPct, setDiscountPct] = useState(10);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }
      setSessionToken(session.access_token);

      try {
        const [affRes, usersRes] = await Promise.all([
          fetch("/api/admin/affiliates", { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch("/api/admin/users", { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        if (affRes.ok) setAffiliates(await affRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!targetUserId || !promoCode || !sessionToken) return;
    setIsAssigning(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ targetUserId, promoCode, commissionPct, discountPct })
      });
      const data = await res.json();
      if (data.success) {
        alert("Affiliate code assigned successfully!");
        // Refresh affiliates
        const affRes = await fetch("/api/admin/affiliates", { headers: { Authorization: `Bearer ${sessionToken}` } });
        if (affRes.ok) setAffiliates(await affRes.json());
        setPromoCode("");
        setTargetUserId("");
      } else {
        alert(data.error || "Failed to assign code.");
      }
    } catch (err) {
      alert("Error assigning code.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete promo code ${code}?`)) return;
    try {
      const res = await fetch("/api/admin/affiliates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        setAffiliates(affiliates.filter(a => a.code !== code));
      } else {
        alert(data.error || "Failed to delete code.");
      }
    } catch (err) {
      alert("Error deleting code.");
    }
  };

  const filteredAffiliates = affiliates.filter(a => 
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.id.includes(userSearchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-accent" /> Assign New Promo Code
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Select User</label>
            <div className="relative">
              <div 
                className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus-within:border-accent flex items-center justify-between cursor-pointer"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                <span className={targetUserId ? "text-white" : "text-gray-500"}>
                  {targetUserId 
                    ? (() => {
                        const u = users.find(u => u.id === targetUserId);
                        return u ? `${u.display_name || u.email} (${u.id})` : targetUserId;
                      })()
                    : "-- Choose User --"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isUserDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[300px]">
                  <div className="p-2 border-b border-white/10 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Search by name, email, or ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto p-2 space-y-1">
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setTargetUserId(u.id);
                          setIsUserDropdownOpen(false);
                          setUserSearchTerm("");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col ${targetUserId === u.id ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="font-bold text-sm">{u.display_name || u.email}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{u.id}</span>
                      </button>
                    )) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">No users found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Promo Code</label>
            <input 
              type="text" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER10"
              className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-accent uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Commission %</label>
            <input 
              type="number" 
              value={commissionPct}
              onChange={(e) => setCommissionPct(Number(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 block">Discount %</label>
            <input 
              type="number" 
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleAssign}
            disabled={isAssigning || !targetUserId || !promoCode}
            className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isAssigning ? 'Assigning...' : <><CheckCircle2 className="w-4 h-4" /> Assign Code</>}
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Affiliate Codes ({filteredAffiliates.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search code or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141414] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white w-full md:w-64 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Code</th>
                <th className="p-4 font-bold">Comm / Disc</th>
                <th className="p-4 font-bold">Owner</th>
                <th className="p-4 font-bold">Stats</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAffiliates.length > 0 ? filteredAffiliates.map((aff) => (
                <tr key={aff.code} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-accent">{aff.code}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{aff.commission_pct}% <span className="text-gray-500 text-xs font-normal">comm</span></span>
                      <span className="font-bold text-emerald-400 text-sm">{aff.discount_pct}% <span className="text-gray-500 text-xs font-normal">disc</span></span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{aff.profiles?.display_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">{aff.profiles?.email}</span>
                      <code className="text-[10px] text-gray-600 font-mono mt-0.5">{aff.owner_id}</code>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col text-xs space-y-1">
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Users:</span> <span className="font-bold text-white">{aff.stats?.usersReferred || 0}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Products:</span> <span className="font-bold text-white">{aff.stats?.totalProductsBought || 0}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Revenue:</span> <span className="font-bold text-emerald-400">€{(aff.stats?.totalRevenue || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Earned:</span> <span className="font-bold text-accent">€{(aff.stats?.totalEarned || 0).toFixed(2)}</span></div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(aff.code)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg border border-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 text-sm">
                    No affiliate codes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
