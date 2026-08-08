"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { MessageSquare, AlertCircle, ShoppingBag, Send } from "lucide-react";
import { toast } from "sonner";
import TicketChat from "./TicketChat";

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
  
  // Chat state
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [isTicketClosed, setIsTicketClosed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkSession = async () => {
      const savedSession = localStorage.getItem('larpsense_ticket_session');
      if (savedSession) {
        // Verify if it's still open in db
        const { data: ticket } = await supabase
          .from('tickets')
          .select('status')
          .eq('ticket_number', parseInt(savedSession))
          .single();
          
        if (ticket && ticket.status !== 'closed') {
          setActiveSession(savedSession);
          setIsTicketClosed(false);
        } else {
          localStorage.removeItem('larpsense_ticket_session');
          // If the session was in localStorage but is closed, we still show the form 
          // (not the locked chat), because they just opened the page.
        }
      }
    };
    checkSession();

    const fetchUserAndOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setLoadingOrders(true);

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

    const savedSession = localStorage.getItem('larpsense_ticket_session');
    let channel: any;
    if (savedSession) {
      channel = supabase
        .channel('ticket-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `ticket_number=eq.${savedSession}`,
          },
          (payload: any) => {
            if (payload.new.status === 'closed') {
              localStorage.removeItem('larpsense_ticket_session');
              setIsTicketClosed(true);
              toast.info("Ticket has been closed by staff.");
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    
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

      const sid = data.ticket_number.toString();
      localStorage.setItem('larpsense_ticket_session', sid);
      
      const formattedMessage = `🟢 **New Ticket from Website!**
**Client Email:** ${user?.email || 'None'}
**Issue Type:** ${issueType}
**Related Order:** ${orderId || 'None'}
**Payment Method:** ${paymentMethod || 'None'}
**Transaction ID:** ${transactionId || 'None'}

**Issue Description:**
${description}`;

      setInitialMessage(formattedMessage);
      setActiveSession(sid);
      toast.success("Ticket #" + sid + " created successfully!");
      
      // Scroll to the top of the page so the newly mounted chat is fully visible
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeSession) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const toastId = toast.loading("Closing ticket...");
      
      const res = await fetch("/api/tickets/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ ticketId: activeSession })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to close ticket.");
      }
      
      toast.success("Ticket closed successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong closing the ticket.");
    } finally {
      localStorage.removeItem('larpsense_ticket_session');
      setIsTicketClosed(true);
      // Wait a moment for them to see it's closed, or we can leave it up to them to refresh/click away
      // We don't unmount immediately.
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

  if (!isMounted) {
    return (
      <div className="w-full flex justify-center items-center h-[600px]">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Jeśli jest aktywna sesja, pokaż ekran czatu zamiast formularza
  if (activeSession) {
    return (
      <div className="w-full">
        {isTicketClosed && (
          <div className="mb-4 text-center">
            <button 
              onClick={() => {
                setActiveSession(null);
                setIssueType("");
                setOrderId("");
                setTransactionId("");
                setPaymentMethod("");
                setDescription("");
                setInitialMessage("");
                setIsTicketClosed(false);
              }}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
            >
              &larr; Start New Ticket
            </button>
          </div>
        )}
        <TicketChat 
          sessionId={activeSession} 
          initialMessage={initialMessage} 
          onCloseTicket={handleCloseTicket} 
          userAvatar={user?.user_metadata?.avatar_url}
          userName={user?.user_metadata?.username || user?.user_metadata?.name || user?.email?.split('@')?.[0] || 'User'}
          isTicketClosed={isTicketClosed}
          onTicketClosedRemotely={() => {
             localStorage.removeItem('larpsense_ticket_session');
             setIsTicketClosed(true);
             toast.info("Ticket has been closed by staff.");
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-accent/10 border border-accent/20 rounded-2xl mb-6 shadow-2xl shadow-accent/20">
          <MessageSquare className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
          Support Center
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Need help with your purchase? Check our FAQ page or reach out to our team directly. We're here to help.
        </p>
      </div>



      <div className="max-w-2xl mx-auto bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-accent" />
          Open a Support Ticket
        </h2>

        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8">
        <p className="text-gray-300 text-sm leading-relaxed">
          <strong className="text-white">Live Support is active!</strong> Fill out this form and you will be immediately connected to our support staff via live chat.
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
            <><Send className="w-5 h-5" /> Start Live Chat</>
          )}
        </button>
      </form>
      </div>

      <div className="flex justify-center mt-16 pb-16">
        <a href="https://discord.gg/qVxdgvdTSK" target="_blank" rel="noopener noreferrer" className="w-full max-w-md flex flex-col items-center justify-center p-8 bg-[#111]/80 backdrop-blur-xl border border-white/10 hover:border-[#5865F2]/30 rounded-3xl transition-all group">
          <div className="w-16 h-16 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <img src="/discord.png" alt="Discord" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Discord Community</h2>
          <p className="text-gray-400 text-center text-sm leading-relaxed mb-4">
            If you encounter any problems with the website or support tickets, please join our Discord and report it there.
          </p>
          <span className="text-[#5865F2] font-medium">Join Server</span>
        </a>
      </div>
    </div>
  );
}
