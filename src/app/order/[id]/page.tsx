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
  ArrowLeft,
  Package,
  Undo2,
  Ban,
  Clock,
  XOctagon,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
        toast.success("Account replaced successfully!", {
          description: typeof data.remaining === "number" ? `Replacements remaining: ${data.remaining}` : undefined
        });
        onReplaceSuccess();
      } else {
        toast.error("Replacement failed", {
          description: data.error || "Unable to replace account."
        });
      }
    } catch (err) {
      toast.error("Error processing replacement.");
    } finally {
      setReplacing(false);
    }
  };
  return (
    <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl overflow-hidden">
      <div className="flex items-center justify-center p-4 bg-[#141414]">
        <input 
          readOnly
          value={account.token}
          className={`w-full bg-transparent text-center font-mono text-sm tracking-widest text-white transition-all duration-300 outline-none ${!revealed ? 'blur-md select-none opacity-50 pointer-events-none' : 'cursor-text'}`}
        />
      </div>

      <div className="grid grid-cols-3 border-t border-[#262626]">
        <button 
          onClick={() => setRevealed(!revealed)}
          className="flex items-center justify-center gap-2 py-3 border-r border-[#262626] text-[#f5f5f7]/50 hover:text-white hover:bg-white/5 transition-colors text-[11px] font-bold uppercase tracking-wider"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} 
          {revealed ? "Hide" : "Reveal"}
        </button>

        <button 
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 py-3 border-r transition-colors text-[11px] font-bold uppercase tracking-wider ${
            copied 
              ? 'bg-white text-black border-white' 
              : 'border-[#262626] text-[#f5f5f7]/50 hover:text-white hover:bg-white/5 bg-transparent'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <button 
          onClick={handleReplace}
          disabled={replacing}
          className={`flex items-center justify-center gap-2 py-3 transition-colors text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 ${
            confirmingReplace
              ? 'text-emerald-500 bg-transparent hover:bg-white/5'
              : 'text-[#f5f5f7]/50 hover:text-white hover:bg-white/5 bg-transparent'
          }`}
        >
          {replacing ? (
            <div className="w-3.5 h-3.5 border-2 border-[#f5f5f7]/30 border-t-[#f5f5f7] rounded-full animate-spin" />
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
        const splitAccounts = data.accounts_data
          ? data.accounts_data
              .split(/\\n|\n/)
              .map((t: string) => t.trim())
              .filter((t: string) => t.length > 0 && !t.startsWith('[') && t.includes(':'))
          : [];
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
      <div className="min-h-screen pt-24 pb-12 px-4 relative z-10 flex justify-center bg-[#0a0a0a]">
        <div className="w-full max-w-[800px] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Back Button */}
          <div>
            <Link href="/dashboard?tab=orders" className="inline-flex items-center gap-2 text-sm text-[#f5f5f7]/50 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
          </div>

          <div className="bg-[#0f0f0f] border border-[#262626] rounded-2xl p-6 md:p-8">
            
            {/* Header - Receipt Style */}
            <div className="border-b border-[#262626] pb-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Order Receipt</h1>
                  <div className="text-[#f5f5f7]/50 font-mono text-sm tracking-tight flex items-center gap-2">
                    Order ID: #{id || "26d757c0"} 
                    <button 
                      onClick={handleCopyId} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] transition-colors text-[11px] font-bold tracking-wider uppercase ${
                        copiedId ? 'bg-white text-black' : 'hover:bg-white/5 hover:text-white'
                      }`}
                      title="Copy full ID"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3 h-3" /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> COPY
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className={`text-[10px] uppercase tracking-widest font-bold ${
                      order?.status === 'completed' ? 'text-emerald-500' :
                      order?.status === 'failed' ? 'text-red-500' :
                      order?.status === 'cancelled' ? 'text-gray-500' :
                      order?.status === 'refunded' ? 'text-indigo-500' :
                      'text-yellow-500'
                  }`}>
                    {order?.status || 'Processing'}
                  </div>
                  <div className="text-sm text-[#f5f5f7]/50 font-medium">
                    {order?.created_at ? new Date(order.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) : 'Unknown Date'}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white font-medium">{order?.product_id === 'topup' ? 'Balance Top-up' : (order?.product_id || 'Product')} <span className="text-[#f5f5f7]/50 ml-1">(x{order?.quantity || 1})</span></span>
                   <span className="text-white font-mono font-bold">€{Number(order?.total_price || 0).toFixed(2)}</span>
                 </div>
                 <div className="w-full h-px bg-[#262626]"></div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#f5f5f7]/50 font-medium tracking-tight">Payment Method</span>
                   <span className="text-white font-medium capitalize tracking-tight">{
                     order?.product_id === 'topup' ? 'Crypto' :
                     order?.accounts_data?.toLowerCase().includes('oxapay') || order?.accounts_data?.toLowerCase().includes('crypto') ? 'Crypto' :
                     order?.accounts_data?.toLowerCase().includes('stripe') ? 'Stripe' : 'Store Balance'
                   }</span>
                 </div>
              </div>
            </div>

            {/* Delivered Items Section */}
            {order?.status !== 'cancelled' && order?.status !== 'refunded' && order?.status !== 'failed' && (
              <>
                {order?.product_id === 'topup' ? (
                  <div className="mb-8 flex flex-col items-center justify-center text-center p-8 bg-[#141414] border border-[#262626] rounded-xl">
                    <Wallet className="w-10 h-10 text-accent mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Balance Top-up</h2>
                    <p className="text-[#f5f5f7]/50 text-sm max-w-[250px] mb-6">
                      {order.status === 'completed' 
                        ? `Your balance has been successfully credited with €${Number(order.total_price).toFixed(2)}.` 
                        : "This top-up request is awaiting payment confirmation."}
                    </p>
                    <div className="inline-flex flex-col gap-1 items-center bg-[#0a0a0a] px-6 py-4 rounded-xl border border-[#262626]">
                      <span className="text-[10px] text-accent uppercase font-bold tracking-widest">Transaction Ref</span>
                      <span className="font-mono text-white text-xs">{order.accounts_data}</span>
                    </div>
                  </div>
                ) : accounts.length > 0 ? (
                  <div className="mb-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <h2 className="text-xl font-bold text-white tracking-tight">Delivered Accounts</h2>
                      <button 
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-2 bg-[#141414] hover:bg-[#262626] border border-[#262626] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" /> Save .txt
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
                            supabase.from('orders').select('*').eq('id', id as string).single().then(({data}) => {
                              if (data) {
                                setOrder(data);
                                const splitAccounts = data.accounts_data
                                  ? data.accounts_data.split(/\n|\n/).map((t: string) => t.trim()).filter((t: string) => t.length > 0 && !t.startsWith('[') && t.includes(':'))
                                  : [];
                                setAccounts(splitAccounts.map((token: string, i: number) => ({ id: i + 1, token })));
                              }
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-10 flex flex-col items-center justify-center text-center p-8 bg-[#141414] border border-[#262626] rounded-xl">
                    <Package className="w-10 h-10 text-[#f5f5f7]/30 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Accounts Available</h3>
                    <p className="text-[#f5f5f7]/50 text-sm">Accounts will appear here once the order is successfully completed.</p>
                  </div>
                )}

                {/* Instructions Section */}
                {order?.product_id !== 'topup' && (
                  <div className="border-t border-[#262626] pt-8">
                    <h2 className="text-xl font-bold text-white tracking-tight mb-6">Setup Instructions</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {/* Step 1 */}
                      <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded bg-[#262626] flex items-center justify-center text-[11px] font-bold text-white">1</div>
                          <h3 className="text-sm font-bold text-white">Get the login tool</h3>
                        </div>
                        <p className="text-xs text-[#f5f5f7]/50 leading-relaxed mb-4 flex-1">We use a dedicated app instead of standard passwords to protect your accounts.</p>
                        
                        {toolLoading ? (
                          <div className="inline-flex items-center gap-2 bg-[#262626]/50 text-[#f5f5f7]/50 px-4 py-2 rounded-lg text-xs font-bold cursor-not-allowed w-fit">
                            <div className="w-3.5 h-3.5 border-2 border-[#f5f5f7]/30 border-t-[#f5f5f7] rounded-full animate-spin"></div> Loading...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <a 
                              href={toolUrl || "#"} 
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Tool
                            </a>
                            {toolVersion && (
                              <span className="text-[10px] font-mono text-emerald-500">
                                {toolVersion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step 2 */}
                      <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded bg-[#262626] flex items-center justify-center text-[11px] font-bold text-white">2</div>
                          <h3 className="text-sm font-bold text-white">Copy credentials</h3>
                        </div>
                        <p className="text-xs text-[#f5f5f7]/50 leading-relaxed">
                          Copy the token provided in the "Delivered Accounts" section above. This acts as your secure login key.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded bg-[#262626] flex items-center justify-center text-[11px] font-bold text-white">3</div>
                          <h3 className="text-sm font-bold text-white">Load account</h3>
                        </div>
                        <p className="text-xs text-[#f5f5f7]/50 leading-relaxed">
                          Insert your copied credentials directly into the software. The system will automatically configure it.
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded bg-[#262626] flex items-center justify-center text-[11px] font-bold text-white">4</div>
                          <h3 className="text-sm font-bold text-white">Play</h3>
                        </div>
                        <p className="text-xs text-[#f5f5f7]/50 leading-relaxed">
                          Boot up Steam using the provided button inside the app. Always use this method when you're ready to play.
                        </p>
                      </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-orange-500 mb-1">Warning: Never log out of Steam manually</h4>
                          <p className="text-xs text-orange-500/80 leading-relaxed">
                            Manually signing out will permanently invalidate your token and destroy your access. Just simply switch accounts or close steam normally.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
