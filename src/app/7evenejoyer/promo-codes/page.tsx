"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Tag, Trash2, Plus, Percent, Users, Calendar, AlertTriangle, Euro } from "lucide-react";

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newPct, setNewPct] = useState<number | "">("");
  const [newMaxUses, setNewMaxUses] = useState<number | "">("");
  const [newMinSpent, setNewMinSpent] = useState<number | "">("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchCodes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSessionToken(session.access_token);

      try {
        const res = await fetch("/api/admin/promo-codes", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCodes(data.promoCodes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  const handleCreate = async () => {
    if (!newCode || !newPct || newPct < 1 || newPct > 100) {
      alert("Invalid code or percentage");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          code: newCode,
          discount_pct: newPct,
          max_uses: newMaxUses ? Number(newMaxUses) : null,
          min_spent: newMinSpent ? Number(newMinSpent) : 0,
          expires_at: newExpiresAt ? new Date(newExpiresAt).toISOString() : null
        })
      });
      const data = await res.json();
      if (res.ok && data.promoCode) {
        setCodes([data.promoCode, ...codes]);
        setNewCode("");
        setNewPct("");
        setNewMaxUses("");
        setNewMinSpent("");
        setNewExpiresAt("");
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed to create code");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        setCodes(codes.filter(c => c.id !== id));
      } else {
        alert("Failed to delete code");
      }
    } catch (err) {
      alert("Error deleting code");
    }
  };

  if (loading) return <div className="animate-pulse flex items-center justify-center p-12 text-gray-500 font-bold">Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Tag className="w-5 h-5 text-accent" /> Promo Codes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Code Name *</label>
            <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-accent uppercase" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Discount % *</label>
            <input type="number" min="1" max="100" value={newPct} onChange={(e) => setNewPct(Number(e.target.value))} placeholder="e.g. 20" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Max Total Uses</label>
            <input type="number" min="1" value={newMaxUses} onChange={(e) => setNewMaxUses(Number(e.target.value))} placeholder="e.g. 50 (optional)" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Min Spent (€)</label>
            <input type="number" min="0" value={newMinSpent} onChange={(e) => setNewMinSpent(Number(e.target.value))} placeholder="e.g. 250 (optional)" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Expires At</label>
            <input type="datetime-local" value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-accent" style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        
        <button onClick={handleCreate} disabled={creating || !newCode || !newPct} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 w-full md:w-auto">
          <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Promo Code'}
        </button>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="p-4 font-bold">Code</th>
                <th className="p-4 font-bold">Discount</th>
                <th className="p-4 font-bold">Uses</th>
                <th className="p-4 font-bold">Min Spent</th>
                <th className="p-4 font-bold">Expires</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.map(c => {
                const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
                const isDepleted = c.max_uses && c.current_uses >= c.max_uses;
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {c.code}
                        {(isExpired || isDepleted) && <span className="bg-red-500/20 text-red-500 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest">Inactive</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-emerald-400">{c.discount_pct}%</td>
                    <td className="p-4 text-sm text-gray-300 font-mono">{c.current_uses} / {c.max_uses || '∞'}</td>
                    <td className="p-4 text-sm font-bold text-gray-300 font-mono">€{c.min_spent}</td>
                    <td className="p-4 text-sm text-gray-400">{c.expires_at ? new Date(c.expires_at).toLocaleString() : 'Never'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors inline-flex">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No promo codes found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
