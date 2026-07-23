"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  CheckCircle2, 
  Download, 
  Eye, 
  EyeOff,
  Copy, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Box, 
  Play,
  Check,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ParticlesBackground from "@/components/ParticlesBackground";

function AccountCard({ 
  account, 
  orderId, 
  productId, 
  accountIdx,
  onReplaceSuccess
}: { 
  account: { id: number, token: string },
  orderId: string,
  productId: string,
  accountIdx: number,
  onReplaceSuccess: () => void
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(account.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };



  const handleReplace = async () => {
    if (!confirmingReplace) {
      setConfirmingReplace(true);
      setTimeout(() => setConfirmingReplace(false), 4000);
      return;
    }
    
    setConfirmingReplace(false);
    setReplacing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to replace accounts.");
        setReplacing(false);
        return;
      }

      const res = await fetch("/api/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accountStr: account.token, 
          orderId, 
          accountIdx, 
          type: productId,
          userId: session.user.id,
          token: session.access_token
        }),
      });
      const data = await res.json();
      
      if (data.ok) {
        toast.success("Account replaced successfully!");
        onReplaceSuccess();
      } else {
        toast.error("Replacement failed", {
          description: data.raw && !data.error.includes(data.raw) 
            ? `${data.error}\n\nNFA Output: ${data.raw.substring(0, 100)}...` 
            : data.error
        });
      }
    } catch (err) {
      toast.error("Error processing replacement.");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-center p-3 bg-black/40 rounded-xl relative overflow-hidden">
        <input 
          readOnly
          value={account.token}
          className={`w-full bg-transparent text-center font-mono text-sm tracking-widest text-white transition-all duration-300 outline-none ${!revealed ? 'blur-md select-none opacity-50 pointer-events-none' : 'cursor-text'}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={() => setRevealed(!revealed)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-semibold"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} 
          {revealed ? "Hide" : "Reveal"}
        </button>

        <button 
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors text-xs font-semibold ${
            copied 
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <button 
          onClick={handleReplace}
          disabled={replacing}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors text-xs font-semibold disabled:opacity-50 ${
            confirmingReplace
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
              : 'border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10'
          }`}
        >
          {replacing ? (
            <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" /> 
          )}
          {replacing 
            ? "Replacing..." 
            : confirmingReplace 
              ? "Confirm" 
              : "Replace"}
        </button>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const [copiedId, setCopiedId] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Stan do pobierania aplikacji
  const [toolUrl, setToolUrl] = useState("");
  const [toolVersion, setToolVersion] = useState("");
  const [toolLoading, setToolLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      
      if (error || !data) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      if (!session || session.user.id !== data.user_id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

        setOrder(data);
        const splitAccounts = data.accounts_data ? data.accounts_data.split(/\\n|\n/) : [];
        setAccounts(splitAccounts.map((token: string, idx: number) => ({
          id: idx + 1,
          token
        })));
      setLoading(false);
    }

    fetchOrder();

    async function fetchTool() {
      try {
        const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "r1k-k/LarpSense-NFA";
        const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (res.ok) {
          const data = await res.json();
          const downloadUrl = data.assets?.find((a: any) => a.name.endsWith(".exe"))?.browser_download_url || data.html_url;
          setToolUrl(downloadUrl);
          setToolVersion(data.tag_name);
        }
      } catch (err) {
        console.error("Failed to fetch tool:", err);
      } finally {
        setToolLoading(false);
      }
    }

    fetchOrder();
    fetchTool();
  }, [id]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(id as string || "26d757c0-31ea-4616-98de-73b22c097550");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = accounts.map(a => a.token).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to view this order.</p>
          <Link href="/" className="inline-block mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold text-sm">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ParticlesBackground />
      <div className="min-h-screen pt-24 pb-12 px-4 relative z-10 flex justify-center">
        <div className="w-full max-w-[900px] bg-[#141414] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link href="/dashboard?tab=orders" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="text-center mb-10 pb-10 border-b border-white/5 relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Order Successful!</h1>
            <p className="text-gray-400 font-medium mb-6">Your payment was processed and your accounts are ready.</p>
            <button 
              onClick={handleCopyId}
              className={`inline-block bg-[#0f0f0f] border rounded-xl px-4 py-2 font-mono text-sm transition-colors ${
                copiedId ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
              }`}
            >
              Order ID: <span className={copiedId ? "text-emerald-400 ml-2" : "text-gray-300 ml-2"}>
                {copiedId ? "Copied!" : (id || "26d757c0-31ea-4616-98de-73b22c097550")}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left Column - Accounts */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Your Accounts</h2>
                <button 
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Save .txt
                </button>
              </div>

              <div className="space-y-4">
                  {accounts.map((acc, idx) => (
                    <AccountCard 
                      key={acc.id} 
                      account={acc} 
                      orderId={order?.id}
                      productId={order?.product_id}
                      accountIdx={idx}
                      onReplaceSuccess={() => {
                        // Re-fetch order to show the newly replaced account
                        supabase.from('orders').select('*').eq('id', id as string).single().then(({data}) => {
                          if (data) {
                            setOrder(data);
                            const splitAccounts = data.accounts_data ? data.accounts_data.split(/\\n|\n/) : [];
                            setAccounts(splitAccounts.map((token: string, i: number) => ({
                              id: i + 1,
                              token
                            })));
                          }
                        });
                      }}
                    />
                  ))}
              </div>
            </div>

            {/* Right Column - Instructions */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white tracking-tight mb-8">How to login?</h2>

              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:via-white/5 before:to-transparent">
                
                {/* Step 1 */}
                <div className="relative flex items-start gap-6">
                  <div className="absolute left-0 md:left-1/2 w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center -translate-x-1/2 mt-0.5 shadow-xl z-10">
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="ml-10 md:ml-0 md:w-1/2 md:pr-10 md:text-right flex flex-col md:items-end">
                    <h3 className="text-sm font-bold text-white mb-2">Get the login tool</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">We use a dedicated app instead of standard passwords. Grab the software here.</p>
                    
                    {toolLoading ? (
                      <div className="inline-flex items-center gap-2 bg-white/20 text-white/50 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Loading...
                      </div>
                    ) : (
                      <div className="flex flex-col md:items-end items-start gap-2">
                        <a 
                          href={toolUrl || "#"} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Login Tool
                        </a>
                        {toolVersion && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                            LATEST RELEASE ({toolVersion})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-6 md:flex-row-reverse">
                  <div className="absolute left-0 md:left-1/2 w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center -translate-x-1/2 mt-0.5 shadow-xl z-10">
                    <Copy className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="ml-10 md:ml-0 md:w-1/2 md:pl-10">
                    <h3 className="text-sm font-bold text-white mb-2">Copy your unique credentials</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Head to your order accounts and hit copy. You'll receive a special token and Steam ID combination instead of a traditional email and password.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-6">
                  <div className="absolute left-0 md:left-1/2 w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center -translate-x-1/2 mt-0.5 shadow-xl z-10">
                    <Box className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="ml-10 md:ml-0 md:w-1/2 md:pr-10 md:text-right">
                    <h3 className="text-sm font-bold text-white mb-2">Load your account</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Insert your copied credentials directly into our app. The system will automatically configure your account.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-6 md:flex-row-reverse">
                  <div className="absolute left-0 md:left-1/2 w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center -translate-x-1/2 mt-0.5 shadow-xl z-10">
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="ml-10 md:ml-0 md:w-1/2 md:pl-10">
                    <h3 className="text-sm font-bold text-white mb-2">Start Steam via the software</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Boot up Steam using the provided button inside the authentication app to gain access. Always use this method when you're ready to play.</p>
                  </div>
                </div>

              </div>

              {/* Warning Box */}
              <div className="mt-10 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
                <div className="flex items-start gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <h4 className="text-sm font-bold text-orange-500">Warning: Never log out of Steam manually</h4>
                </div>
                <p className="text-xs text-orange-500/80 leading-relaxed ml-8">
                  Manually signing out will permanently invalidate your token and destroy your access. Just simply switch accounts or just close steam normally.
                </p>
              </div>

              <p className="text-[11px] text-gray-600 mt-6 text-center leading-relaxed">
                If your account faces any issues, navigate back to your order details to request a hassle-free replacement under your warranty.
              </p>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
