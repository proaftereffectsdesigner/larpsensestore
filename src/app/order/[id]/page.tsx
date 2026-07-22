"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Copy, RefreshCw, CheckCircle2, Search, AlertCircle, Eye, EyeOff, Download, TerminalSquare, Play, AlertTriangle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const [checkingIdx, setCheckingIdx] = useState<number | null>(null);
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
      
    if (!error && data) {
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="p-20 text-center text-white">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-20 text-center text-red-400">Order not found.</div>;
  }

  const accounts = order.accounts_data ? order.accounts_data.split("\\n") : [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleCheck = async (accountStr: string, idx: number) => {
    setCheckingIdx(idx);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStr }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert(`Status: ${data.status}\\nMessage: ${data.message || 'Account looks good!'}`);
      } else {
        alert("Check failed: " + data.error);
      }
    } catch (err) {
      alert("Error checking account.");
    } finally {
      setCheckingIdx(null);
    }
  };

  const handleReplace = async (accountStr: string, idx: number) => {
    if (!confirm("Are you sure you want to replace this account? You can only replace bad accounts within 6 hours.")) return;
    
    setReplacingIdx(idx);
    try {
      const res = await fetch("/api/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStr, orderId: order.id, accountIdx: idx }),
      });
      const data = await res.json();
      
      if (data.ok) {
        alert("Account replaced successfully!");
        fetchOrder();
      } else {
        alert("Replacement failed: " + data.error);
      }
    } catch (err) {
      alert("Error processing replacement.");
    } finally {
      setReplacingIdx(null);
    }
  };

  const downloadAsTxt = () => {
    const textContent = accounts.join("\n");
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LarpSenseStore-Order-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12 w-full">
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center mb-10 border-b border-white/10 pb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Successful!</h1>
          <p className="text-[#a1a1aa]">Your payment was processed and your accounts are ready.</p>
          <div className="mt-4 font-mono text-sm bg-white/5 px-4 py-2 rounded-lg text-gray-400 border border-white/10">
            Order ID: {order.id}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Your Accounts</h2>
              <button 
                onClick={downloadAsTxt}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-white/10"
              >
                <Download className="w-4 h-4" /> Save .txt
              </button>
            </div>
            <div className="space-y-4">
              {accounts.map((acc: string, idx: number) => {
                const isRevealed = revealedIdx === idx;
                return (
                  <div key={idx} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className={`font-mono text-[#ededed] break-all text-sm w-full bg-white/5 p-3 rounded-lg border border-white/5 transition-all duration-300 ${!isRevealed ? 'blur-[4px] select-none opacity-60' : ''}`}>
                      {acc}
                    </div>
                    <div className="flex gap-2 w-full flex-wrap">
                      <button 
                        onClick={() => setRevealedIdx(isRevealed ? null : idx)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-white/10"
                      >
                        {isRevealed ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Reveal</>}
                      </button>
                      <button 
                        onClick={() => copyToClipboard(acc)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-white/10"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                      <button 
                        onClick={() => handleCheck(acc, idx)}
                        disabled={checkingIdx === idx}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm transition-colors border border-blue-500/20 disabled:opacity-50"
                      >
                        {checkingIdx === idx ? <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Check</>}
                      </button>
                      <button 
                        onClick={() => handleReplace(acc, idx)}
                        disabled={replacingIdx === idx}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm transition-colors border border-red-500/20 disabled:opacity-50"
                      >
                        {replacingIdx === idx ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Replace</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl h-fit">
            <h3 className="text-xl font-bold text-white mb-6">How to login?</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              
              {/* Step 1 */}
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shrink-0 relative z-10 text-gray-400">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">Get the login tool</h4>
                  <p className="text-sm text-gray-400 mb-3">We use a dedicated app instead of standard passwords. Grab the software here.</p>
                  <a 
                    href="https://github.com/r1k-k/LarpSense-NFA/releases/download/v1.1.0/LarpSense.NFA.Tool.exe" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#eeeeee] hover:bg-white text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Login Tool
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shrink-0 relative z-10 text-gray-400">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">Copy your unique credentials</h4>
                  <p className="text-sm text-gray-400">Head to your order accounts and hit copy. You'll receive a special token and Steam ID combination instead of a traditional email and password.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shrink-0 relative z-10 text-gray-400">
                  <TerminalSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">Load your account</h4>
                  <p className="text-sm text-gray-400">Insert your copied credentials directly into our app. The system will automatically configure your account.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center shrink-0 relative z-10 text-gray-400">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">Start Steam via the software</h4>
                  <p className="text-sm text-gray-400">Boot up Steam using the provided button inside the authentication app to gain access. Always use this method when you're ready to play.</p>
                </div>
              </div>

            </div>

            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                <AlertTriangle className="w-5 h-5" /> Warning: Never log out of Steam manually
              </div>
              <p className="text-sm text-amber-500/80">Manually signing out will permanently invalidate your token and destroy your access. Just simply switch accounts or just close steam normally.</p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 text-xs text-gray-500">
              If your account faces any issues, navigate back to your order details to request a hassle-free replacement under your warranty.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
