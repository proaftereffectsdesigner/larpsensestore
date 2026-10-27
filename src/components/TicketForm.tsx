"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { MessageSquare, AlertCircle, ShoppingBag, Send } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
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
  const [profile, setProfile] = useState<any>(null);
  
  // Chat state
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [isTicketClosed, setIsTicketClosed] = useState(false);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const typeMap: Record<string, string> = {
        'token': 'invalid_token',
        'order': 'missing_delivery',
        'payment': 'payment_issue',
        'general': 'general_question',
        'other': 'other'
      };
      if (typeMap[typeParam]) {
        setIssueType(typeMap[typeParam]);
      }
    }
  }, [searchParams]);

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

        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);

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
      <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 text-center max-w-2xl mx-auto">
        <AlertCircle className="w-12 h-12 text-[#f5f5f7]/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#f5f5f7] mb-2">Log in to create a ticket</h2>
        <p className="text-[#f5f5f7]/50 mb-6 max-w-sm mx-auto">You must be logged in to open a support ticket so we can securely link it to your account.</p>
        <button 
          onClick={() => window.dispatchEvent(new Event('open-auth'))}
          className="bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black font-bold rounded-lg px-8 py-3 transition-colors"
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
              className="px-6 py-3 bg-[#141414] border border-[#262626] hover:bg-[#1a1a1a] rounded-xl text-[#f5f5f7] font-medium transition-colors"
            >
              &larr; Start New Ticket
            </button>
          </div>
        )}
        <TicketChat 
          sessionId={activeSession} 
          initialMessage={initialMessage} 
          onCloseTicket={handleCloseTicket} 
          userAvatar={profile?.avatar_url || user?.user_metadata?.avatar_url}
          userName={profile?.display_name || user?.user_metadata?.username || user?.user_metadata?.name || user?.email?.split('@')?.[0] || 'User'}
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
    <div className="w-full h-full">
      <div className="max-w-2xl mx-auto bg-[#0a0a0a] border border-[#262626] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#262626] shrink-0 bg-[#0a0a0a] rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#262626] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#47c92f]" />
            </div>
            <div>
              <div className="font-bold text-[#f5f5f7]">Support Assistant</div>
              <div className="text-xs text-[#47c92f] flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#47c92f] animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex flex-col">
          
          <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#262626] shrink-0 flex items-center justify-center mt-1 hidden sm:flex">
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl rounded-tl-sm p-4 text-sm text-[#f5f5f7] w-full sm:w-auto">
              <p className="mb-4 text-gray-300">Hi there! 👋 I'm here to help. To get started, please select the type of issue you're experiencing.</p>
              
              <select 
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                required
                className="w-full sm:min-w-[280px] bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-3 text-[#f5f5f7] focus:outline-none focus:border-[#404040] transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Select an issue type...</option>
                <option value="invalid_token">Invalid / Expired Token</option>
                <option value="missing_delivery">Order not delivered</option>
                <option value="payment_issue">Payment Issue / Top-up failed</option>
                <option value="general_question">General Question</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {(issueType === 'payment_issue' || issueType === 'missing_delivery' || issueType === 'invalid_token') && (
            <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#262626] shrink-0 flex items-center justify-center mt-1 hidden sm:flex">
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </div>
              <div className="bg-[#141414] border border-[#262626] rounded-2xl rounded-tl-sm p-4 sm:p-5 text-sm text-[#f5f5f7] w-full">
                <p className="mb-5 text-gray-300">Thanks. Please provide the order details so we can locate your transaction and assist you faster.</p>
                
                <div className="space-y-4 bg-[#0a0a0a] p-4 rounded-xl border border-[#262626]">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest text-gray-500 mb-1.5 uppercase flex items-center gap-2">
                      <ShoppingBag className="w-3 h-3" /> Related Order
                    </label>
                    <select 
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2.5 text-[#f5f5f7] focus:outline-none focus:border-[#404040] transition-colors appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      <option value="">No specific order (or order not listed)</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          Order #{o.id.split('-')[0]} - {new Date(o.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-gray-500 mb-1.5 uppercase">Payment Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2.5 text-[#f5f5f7] focus:outline-none focus:border-[#404040] transition-colors appearance-none cursor-pointer text-xs sm:text-sm"
                      >
                        <option value="">Select method (Optional)</option>
                        <option value="Stripe / Card">Stripe / Card</option>
                        <option value="Crypto (Coinbase)">Crypto (Coinbase Commerce)</option>
                        <option value="Balance">Store Balance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest text-gray-500 mb-1.5 uppercase">Transaction ID</label>
                      <input 
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. pi_... or hash"
                        className="w-full bg-[#141414] border border-[#262626] rounded-lg px-3 py-2.5 text-[#f5f5f7] focus:outline-none focus:border-[#404040] transition-colors text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {issueType && (
            <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#262626] shrink-0 flex items-center justify-center mt-1 hidden sm:flex">
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </div>
              <div className="bg-[#141414] border border-[#262626] rounded-2xl rounded-tl-sm p-4 text-sm text-[#f5f5f7]">
                <p className="text-gray-300 leading-relaxed">Perfect. Now, please describe your issue below. <strong className="text-[#47c92f] font-medium">Once you hit send, you'll be connected to a live staff member.</strong></p>
              </div>
            </div>
          )}

        </div>

        {/* Chat Input / Form Submit Area */}
        <div className="p-4 sm:p-6 border-t border-[#262626] shrink-0 bg-[#0a0a0a]">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-start gap-3 bg-[#141414] border border-[#333] hover:border-[#444] rounded-xl p-3 focus-within:border-[#555] transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Type your message here to start the live chat..."
                rows={3}
                className="flex-1 bg-transparent !outline-none !border-none !ring-0 focus:!outline-none focus:!border-none focus:!ring-0 text-sm text-[#f5f5f7] resize-none py-1 px-1 min-h-[70px] placeholder:text-gray-500 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (description.trim() && issueType) {
                       handleSubmit(e as any);
                    }
                  }
                }}
              />
              <button 
                type="submit"
                disabled={submitting || !issueType || !description.trim()}
                className="p-3 mt-auto bg-[#47c92f] text-black rounded-lg hover:bg-[#3db028] transition-colors disabled:opacity-50 disabled:bg-[#262626] disabled:text-gray-600 shrink-0"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </div>
            <div className="text-center mt-3 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
              Press enter to send
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
