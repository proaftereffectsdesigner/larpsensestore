"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Settings, Save, AlertTriangle, CreditCard, Bitcoin } from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const router = useRouter();

  const [settings, setSettings] = useState({
    stripe_enabled: true,
    crypto_enabled: true,
    announcement_text: "",
    announcement_color: "amber"
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }
      setSessionToken(session.access_token);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings({
            stripe_enabled: data.stripe_enabled ?? true,
            crypto_enabled: data.crypto_enabled ?? true,
            announcement_text: data.announcement_text || "",
            announcement_color: data.announcement_color || "amber"
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSave = async () => {
    if (!sessionToken) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        const data = await res.json();
        alert("Error saving settings: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse w-full h-64 bg-white/5 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Global Announcements */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> 
            Global Announcement
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Announcement Message (Leave empty to hide)</label>
            <input 
              type="text" 
              value={settings.announcement_text} 
              onChange={(e) => setSettings({...settings, announcement_text: e.target.value})}
              placeholder="e.g. We have a problem with payments..."
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2">Color Theme</label>
            <div className="flex gap-4">
              {['red', 'orange', 'yellow', 'green'].map(color => (
                <label key={color} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="color" 
                    value={color}
                    checked={settings.announcement_color === color}
                    onChange={(e) => setSettings({...settings, announcement_color: e.target.value})}
                    className="accent-accent w-4 h-4"
                  />
                  <span className={`uppercase text-xs font-bold ${
                    color === 'red' ? 'text-red-400' : 
                    color === 'orange' ? 'text-orange-400' : 
                    color === 'yellow' ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>{color}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> 
            Payment Methods
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${settings.stripe_enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-500/20 text-gray-500'}`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-bold ${settings.stripe_enabled ? 'text-white' : 'text-gray-500'}`}>Stripe (Credit Card)</p>
                <p className="text-sm text-gray-500">Enable or disable fiat payments globally</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.stripe_enabled ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.stripe_enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            {/* Hidden actual checkbox */}
            <input 
              type="checkbox" 
              checked={settings.stripe_enabled}
              onChange={(e) => setSettings({...settings, stripe_enabled: e.target.checked})}
              className="hidden"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${settings.crypto_enabled ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-500'}`}>
                <Bitcoin className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-bold ${settings.crypto_enabled ? 'text-white' : 'text-gray-500'}`}>Cryptocurrency (Plisio)</p>
                <p className="text-sm text-gray-500">Enable or disable crypto payments globally</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.crypto_enabled ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.crypto_enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            {/* Hidden actual checkbox */}
            <input 
              type="checkbox" 
              checked={settings.crypto_enabled}
              onChange={(e) => setSettings({...settings, crypto_enabled: e.target.checked})}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

    </div>
  );
}
