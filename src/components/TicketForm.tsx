"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { MessageSquare, AlertCircle, ShoppingBag, Send } from "lucide-react";
import { toast } from "sonner";

export default function TicketForm() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [issueType, setIssueType] = useState("");
  const [orderId, setOrderId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isDiscordLinked, setIsDiscordLinked] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setLoadingOrders(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('discord_id')
          .eq('id', session.user.id)
          .single();
        
        setIsDiscordLinked(!!profile?.discord_id);

        const { data } = await supabase
          .from('orders')
          .select('id, product_id, created_at, status')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (data) setOrders(data);
        setLoadingOrders(false);
      }
    };
    
    fetchUserAndOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    
    // Append extra info to description
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          issueType,
          orderId: orderId || null,
          description,
          transactionId,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket.");

      toast.success(`Ticket #${data.ticket_number} created successfully! We will contact you soon.`);
      setIssueType("");
      setOrderId("");
      setTransactionId("");
      setPaymentMethod("");
      setDescription("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Log in to create a ticket</h2>
        <p className="text-gray-400 mb-6 max-w-sm mx-auto">You must be logged in to open a support ticket so we can securely link it to your account.</p>
        <button 
          onClick={() => window.dispatchEvent(new Event('open-auth'))}
          className="bg-accent hover:bg-accent/80 text-white font-bold rounded-xl px-8 py-3 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-accent" />
        Open a Support Ticket
      </h2>

      {isDiscordLinked === null ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : isDiscordLinked === false ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Discord Linking Required</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            To create a ticket from the website, you <strong>must link your Discord account</strong> in the Dashboard. Otherwise, please join our Discord server directly to open a ticket there.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <a href={`/api/discord/link?userId=${user?.id}`} className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] font-semibold rounded-lg px-6 py-2 transition-colors text-sm flex items-center gap-2">
              <img src="/discord.png" alt="Discord" className="w-5 h-5 object-contain drop-shadow-md" />
              Link Discord Account
            </a>
            <a href="https://discord.gg/qVxdgvdTSK" target="_blank" rel="noreferrer" className="bg-[#5865F2] hover:bg-[#5865F2]/80 text-white font-bold rounded-lg px-6 py-2 transition-colors text-sm">
              Join Discord Server
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8">
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">Your Discord is linked!</strong> You can submit this form and your message will be forwarded to our team. <br/>
              <span className="text-accent font-semibold">Important:</span> We cannot reply to you unless you are physically present in our Discord server. Please ensure you have joined our server to read our response.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Issue Type */}
        <div>
          <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Issue Type *</label>
          <select 
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all appearance-none"
            required
          >
            <option value="" disabled>Select an issue type...</option>
            <option value="invalid_token">Invalid / Expired Token</option>
            <option value="missing_delivery">Order not delivered</option>
            <option value="payment_issue">Payment Issue / Top-up failed</option>
            <option value="general_question">General Question</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Order Selection */}
        {(issueType === 'payment_issue' || issueType === 'missing_delivery' || issueType === 'invalid_token') && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase flex items-center gap-2">
              <ShoppingBag className="w-3 h-3" /> Related Order (Optional)
            </label>
            <select 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all appearance-none"
            >
              <option value="">No specific order (or order not listed)</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  Order #{o.id.split('-')[0]} - {new Date(o.created_at).toLocaleDateString()} ({o.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Extra Information based on Issue Type */}
        {(issueType === 'payment_issue' || issueType === 'missing_delivery' || issueType === 'invalid_token') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-all appearance-none text-sm"
              >
                <option value="">Select method (Optional)</option>
                <option value="Stripe / Card">Stripe / Card</option>
                <option value="Crypto (Coinbase)">Crypto (Coinbase Commerce)</option>
                <option value="Balance">Store Balance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Transaction ID</label>
              <input 
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. pi_... or hash"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 transition-all text-sm"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Description *</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Please describe your issue in detail..."
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-white font-bold rounded-xl px-6 py-4 hover:bg-accent/80 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Send className="w-5 h-5" /> Submit Ticket</>
          )}
        </button>
      </form>
      </>
      )}
    </div>
  );
}
