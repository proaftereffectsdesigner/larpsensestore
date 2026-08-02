"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { MessageSquare } from "lucide-react";

export default function AdminTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [closingTicket, setClosingTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const router = useRouter();

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
        const res = await fetch("/api/admin/tickets", { 
          headers: { Authorization: `Bearer ${session.access_token}` } 
        });
        if (res.ok) {
          setTickets(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch tickets", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCloseTicket = async (ticketId: string) => {
    if (!sessionToken || !confirm("Are you sure you want to close this ticket? It will generate a transcript and delete the Discord channel.")) return;
    setClosingTicket(ticketId);
    
    try {
      const res = await fetch("/api/tickets/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ ticketId })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Ticket closed successfully. Transcript generated!");
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'closed', transcript_url: data.transcript_url } : t));
      } else {
        alert("Error closing ticket: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while closing the ticket.");
    } finally {
      setClosingTicket(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse w-full h-64 bg-white/5 rounded-2xl"></div>;
  }

  const openTickets = tickets.filter(t => t.status === 'open');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-gray-400" /> Active Tickets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="p-4 font-bold">Ticket #</th>
                <th className="p-4 font-bold">Subject</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Created At</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {openTickets.slice((ticketsPage - 1) * 10, ticketsPage * 10).map(ticket => (
                <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white">#{ticket.ticket_number || ticket.id.split('-')[0]}</td>
                  <td className="p-4 text-sm text-gray-400">{ticket.issue_type.replace(/_/g, ' ')}</td>
                  <td className="p-4">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">{ticket.status}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleCloseTicket(ticket.id)}
                      disabled={closingTicket === ticket.id}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {closingTicket === ticket.id ? "Closing..." : "Close & Generate Transcript"}
                    </button>
                  </td>
                </tr>
              ))}
              {openTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">No active tickets</td>
                </tr>
              )}
            </tbody>
          </table>
          {openTickets.length > 10 && (
            <div className="p-4 border-t border-white/10 flex justify-center gap-2">
              <button onClick={() => setTicketsPage(Math.max(1, ticketsPage - 1))} disabled={ticketsPage === 1} className="px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors rounded text-sm disabled:opacity-50 text-white font-bold">Prev</button>
              <span className="text-gray-400 text-sm px-4 py-1 font-bold">Page {ticketsPage} of {Math.ceil(openTickets.length / 10)}</span>
              <button onClick={() => setTicketsPage(ticketsPage + 1)} disabled={ticketsPage * 10 >= openTickets.length} className="px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors rounded text-sm disabled:opacity-50 text-white font-bold">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
