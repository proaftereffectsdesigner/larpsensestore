"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Users, CreditCard, Activity, Euro, Plus, Minus, Search, Shield, Copy, CheckCircle2, UserX, Trash2, Calendar, Monitor, Link as LinkIcon, ExternalLink, Settings } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'banned' | 'restricted'>('all');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Modal for updating balance
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceAmount, setBalanceAmount] = useState<number>(0);
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Ban Modal state
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent"); // permanent, 7d, 30d, 90d, 1y, custom
  const [customBanDays, setCustomBanDays] = useState("14");
  const [customBanDate, setCustomBanDate] = useState("");

  // Restrict Modal state
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false);
  const [restrictReason, setRestrictReason] = useState("");
  const [restrictDuration, setRestrictDuration] = useState("permanent");
  const [customRestrictDays, setCustomRestrictDays] = useState("14");
  const [customRestrictDate, setCustomRestrictDate] = useState("");
  const [restrictFlags, setRestrictFlags] = useState({
    can_topup: false,
    can_purchase: false,
    can_update_profile: false
  });

  // Flags for modal
  const [userFlags, setUserFlags] = useState({
    is_banned: false,
    can_topup: true,
    can_purchase: true,
    can_update_profile: true
  });
  const [updatingFlags, setUpdatingFlags] = useState(false);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    setTimeout(() => setCopiedId(null), 2000);
  };
  // Helpers for syncing custom dates/days
  const updateBanDays = (days: string) => {
    setCustomBanDays(days);
    const d = parseInt(days, 10);
    if (!isNaN(d) && d > 0) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      setCustomBanDate(date.toISOString().split('T')[0]);
    } else {
      setCustomBanDate("");
    }
  };

  const updateBanDate = (dateStr: string) => {
    setCustomBanDate(dateStr);
    if (dateStr) {
      const diffTime = new Date(dateStr).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCustomBanDays(diffDays > 0 ? diffDays.toString() : "1");
    }
  };

  const updateRestrictDays = (days: string) => {
    setCustomRestrictDays(days);
    const d = parseInt(days, 10);
    if (!isNaN(d) && d > 0) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      setCustomRestrictDate(date.toISOString().split('T')[0]);
    } else {
      setCustomRestrictDate("");
    }
  };

  const updateRestrictDate = (dateStr: string) => {
    setCustomRestrictDate(dateStr);
    if (dateStr) {
      const diffTime = new Date(dateStr).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCustomRestrictDays(diffDays > 0 ? diffDays.toString() : "1");
    }
  };

  // Helper to open modal with pre-filled data
  const openBanModal = () => {
    const flags: any = userFlags;
    setBanReason(flags.ban_reason || "");
    if (flags.ban_expires_at) {
      setBanDuration('custom');
      updateBanDate(new Date(flags.ban_expires_at).toISOString().split('T')[0]);
    } else {
      setBanDuration('permanent');
      updateBanDays("14");
    }
    setIsBanModalOpen(true);
  };

  // Helper to open restrictions modal
  const openRestrictModal = () => {
    const flags: any = userFlags;
    setRestrictFlags({
      can_topup: flags.can_topup,
      can_purchase: flags.can_purchase,
      can_update_profile: flags.can_update_profile
    });
    setRestrictReason(flags.ban_reason || "");
    if (flags.ban_expires_at) {
      setRestrictDuration('custom');
      updateRestrictDate(new Date(flags.ban_expires_at).toISOString().split('T')[0]);
    } else {
      setRestrictDuration('permanent');
      updateRestrictDays("14");
    }
    setIsRestrictModalOpen(true);
  };


  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSessionToken(session.access_token);

      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch("/api/admin/users", { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateBalance = async () => {
    if (!selectedUser || !sessionToken) return;
    setUpdatingBalance(true);

    try {
      const res = await fetch("/api/admin/users/update-balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          amount: balanceAmount,
          type: balanceAction
        })
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: data.newBalance } : u));
        setSelectedUser({ ...selectedUser, balance: data.newBalance });
        // Dispatch event so the navbar catches it if you edit your own balance
        window.dispatchEvent(new Event('balance-updated'));
      } else {
        alert("Failed to update balance: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setUpdatingBalance(false);
    }
  };

  const handleUpdateFlags = async (flagsToUpdate: any) => {
    if (!selectedUser || !sessionToken) return;
    setUpdatingFlags(true);
    
    // Optimistic UI update
    setUserFlags({ ...userFlags, ...flagsToUpdate });
    const originalUser = { ...selectedUser };
    setSelectedUser({ ...selectedUser, ...flagsToUpdate });
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...flagsToUpdate } : u));

    try {
      const res = await fetch("/api/admin/users/update-flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          flags: { ...userFlags, ...flagsToUpdate }
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert("Failed to update flags: " + data.error);
        // Revert
        setUserFlags({ ...userFlags });
        setSelectedUser(originalUser);
        setUsers(users.map(u => u.id === selectedUser.id ? originalUser : u));
      } else {
        const safeData = data.user || flagsToUpdate;
        const updatedTarget = { 
          ...selectedUser,
          is_banned: safeData.is_banned,
          can_topup: safeData.can_topup,
          can_purchase: safeData.can_purchase,
          can_update_profile: safeData.can_update_profile,
          ban_reason: safeData.ban_reason,
          ban_type: safeData.ban_type,
          ban_expires_at: safeData.ban_expires_at,
          ban_acknowledged: safeData.ban_acknowledged,
          banned_at: safeData.banned_at
        };
        setUserFlags({ ...updatedTarget });
        setSelectedUser(updatedTarget);
        
        setUsers(prev => prev.map(u => {
          if (u.id === updatedTarget.id) {
            return updatedTarget;
          }
          if (data.cascaded && data.targetIp && u.last_ip === data.targetIp && !u.is_admin) {
            if (data.cascadeType === 'ban') {
              return { ...u, is_banned: true, can_topup: false, can_purchase: false, can_update_profile: false };
            } else if (data.cascadeType === 'unban') {
              return { ...u, is_banned: false, can_topup: true, can_purchase: true, can_update_profile: true };
            } else if (data.cascadeType === 'restrict') {
              return { ...u, is_banned: false, can_topup: updatedTarget.can_topup, can_purchase: updatedTarget.can_purchase, can_update_profile: updatedTarget.can_update_profile };
            }
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred updating flags.");
      // Revert
      setUserFlags({ ...userFlags });
      setSelectedUser(originalUser);
      setUsers(users.map(u => u.id === selectedUser.id ? originalUser : u));
    } finally {
      setUpdatingFlags(false);
    }
  };

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setUserFlags({
      is_banned: user.is_banned || false,
      can_topup: user.can_topup !== false, // default true
      can_purchase: user.can_purchase !== false, // default true
      can_update_profile: user.can_update_profile !== false // default true
    });
  };

  const filteredUsers = users.filter(u => {
    // 1. Text search
    const matchesSearch = !searchTerm || (
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.discord_username && u.discord_username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.last_ip && u.last_ip.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Status filter
    let matchesStatus = true;
    if (filterType === 'banned') {
      matchesStatus = u.is_banned === true;
    } else if (filterType === 'restricted') {
      matchesStatus = u.can_topup === false || u.can_purchase === false || u.can_update_profile === false;
    }

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="animate-pulse flex gap-4"><div className="w-64 h-32 bg-white/5 rounded-2xl"></div><div className="w-64 h-32 bg-white/5 rounded-2xl"></div></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Euro className="w-4 h-4 text-accent" /> Total Revenue</h3>
          <p className="text-4xl font-black text-white">€{stats?.totalEarned?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Total Orders</h3>
          <p className="text-4xl font-black text-white">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Total Users</h3>
          <p className="text-4xl font-black text-white">{stats?.totalUsers || 0}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-gray-400" /> Users & Balances</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${filterType === 'all' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'}`}>All Users</button>
              <button onClick={() => setFilterType('banned')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${filterType === 'banned' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-transparent border-transparent text-gray-500 hover:text-red-400/70'}`}>Banned</button>
              <button onClick={() => setFilterType('restricted')} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${filterType === 'restricted' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-transparent border-transparent text-gray-500 hover:text-orange-400/70'}`}>Restricted</button>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Discord</th>
                <th className="p-4 font-bold">Orders</th>
                <th className="p-4 font-bold">Total Spent</th>
                <th className="p-4 font-bold">Balance</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span className={user.is_banned ? "text-gray-500 line-through" : ""}>{user.display_name || 'Unknown'}</span>
                          {user.is_admin && <Shield className="w-3 h-3 text-red-500" />}
                          {user.is_banned && <span className="bg-red-500/20 text-red-500 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Banned</span>}
                          {(!user.can_topup || !user.can_purchase) && !user.is_banned && <span className="bg-orange-500/20 text-orange-500 text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">Restricted</span>}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">{user.discord_username || '-'}</td>
                  <td className="p-4 text-sm font-bold text-gray-300">{user.total_orders}</td>
                  <td className="p-4 text-sm font-bold text-accent">€{(user.total_spent || 0).toFixed(2)}</td>
                  <td className="p-4 text-sm font-mono text-emerald-400 font-bold">€{(Number(user.balance) || 0).toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={`/user/${user.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0"
                        title="View Public Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => openUserModal(user)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedUser(null)}></div>
          <div className="bg-[#141414] border border-white/10 rounded-2xl relative z-10 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200">
            
            {/* Header */}
            <div className={`p-6 border-b border-white/10 ${userFlags.is_banned ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.02]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/10 shrink-0">
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" className={`w-full h-full object-cover ${userFlags.is_banned ? 'grayscale' : ''}`} /> : <Users className="w-8 h-8 text-gray-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 truncate">
                    <span className={userFlags.is_banned ? 'line-through text-gray-400' : ''}>{selectedUser.display_name || 'Unknown User'}</span>
                    {selectedUser.is_admin && <span className="bg-red-500/20 text-red-400 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold border border-red-500/20 shrink-0">Admin</span>}
                    {userFlags.is_banned && <span className="bg-red-500 text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold shrink-0">Banned</span>}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{selectedUser.email || 'No email registered'}</p>
                </div>
                <div className="ml-auto shrink-0 hidden sm:flex">
                  <a href={`/user/${selectedUser.id}`} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5" /> Public Profile
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* System ID */}
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Monitor className="w-3 h-3" /> System ID</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-gray-300 truncate font-mono">{selectedUser.id}</code>
                    <button onClick={() => handleCopy(selectedUser.id, 'id')} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white shrink-0">
                      {copiedId === 'id' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Discord Details */}
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-[#5865F2] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> Discord Link</div>
                  {selectedUser.discord_id ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{selectedUser.discord_username}</div>
                        <code className="text-[10px] text-gray-500 truncate block font-mono mt-0.5">{selectedUser.discord_id}</code>
                      </div>
                      <button onClick={() => handleCopy(selectedUser.discord_id, 'discord')} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white shrink-0">
                        {copiedId === 'discord' ? <CheckCircle2 className="w-4 h-4 text-[#5865F2]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic mt-1">Not linked</div>
                  )}
                </div>
                
                {/* Joined At */}
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Registration Date</div>
                  <div className="text-sm text-white font-medium">
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </div>
                </div>

                {/* IP Address */}
                <div className="bg-[#0a0a0a] rounded-xl p-4 border border-white/5">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Last Known IP</div>
                  {selectedUser.last_ip ? (
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-gray-300 truncate font-mono">{selectedUser.last_ip}</code>
                      <button onClick={() => handleCopy(selectedUser.last_ip, 'ip')} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white shrink-0">
                        {copiedId === 'ip' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic mt-1">Unknown</div>
                  )}
                </div>
              </div>

              {/* Related Accounts (Same IP) */}
              {selectedUser.last_ip && users.filter(u => u.id !== selectedUser.id && u.last_ip === selectedUser.last_ip).length > 0 && (
                <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 mt-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Related Accounts (Same IP)
                  </h4>
                  <div className="space-y-2">
                    {users.filter(u => u.id !== selectedUser.id && u.last_ip === selectedUser.last_ip).map(related => (
                      <div key={related.id} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openUserModal(related)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {related.avatar_url ? <img src={related.avatar_url} alt="" className={`w-full h-full object-cover ${related.is_banned ? 'grayscale' : ''}`} /> : <Users className="w-4 h-4 text-gray-500" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span className={related.is_banned ? 'line-through text-gray-500' : ''}>{related.display_name || related.email}</span>
                              {related.is_banned && <span className="bg-red-500 text-white text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Banned</span>}
                              {(!related.can_topup || !related.can_purchase || !related.can_update_profile) && !related.is_banned && <span className="bg-orange-500/20 text-orange-500 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Restricted</span>}
                            </div>
                            <div className="text-[10px] text-gray-500">{new Date(related.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <a 
                            href={`/user/${related.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 p-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center shrink-0"
                            title="View Public Profile"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button 
                            onClick={() => openUserModal(related)}
                            className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1.5 rounded-md border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet Manager */}
              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
                <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Wallet Management</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-emerald-400/70 mb-1 font-bold uppercase tracking-wider">Current Balance</p>
                    <p className="text-2xl font-mono font-bold text-white">€{(Number(selectedUser.balance) || 0).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="space-y-4 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                  <div className="flex bg-[#141414] rounded-xl p-1 border border-white/5">
                    <button 
                      onClick={() => setBalanceAction('add')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${balanceAction === 'add' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                    <button 
                      onClick={() => setBalanceAction('subtract')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${balanceAction === 'subtract' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Minus className="w-4 h-4" /> Subtract
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={balanceAmount || ''}
                        onChange={(e) => setBalanceAmount(parseFloat(e.target.value))}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                        placeholder="Amount"
                      />
                    </div>
                    <button 
                      onClick={handleUpdateBalance}
                      disabled={updatingBalance || !balanceAmount}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {updatingBalance ? 'Updating...' : 'Execute'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone & Restrictions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Kill Switches */}
                <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10 flex flex-col md:col-span-2">
                  <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2"><UserX className="w-4 h-4" /> Account Controls</h4>
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    
                    {userFlags.is_banned ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => handleUpdateFlags({ 
                            is_banned: false, 
                            can_topup: true, 
                            can_purchase: true, 
                            can_update_profile: true,
                            ban_expires_at: null,
                            ban_reason: null
                          })}
                          disabled={updatingFlags}
                          className="flex-[2] flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Unban
                        </button>
                        <button 
                          onClick={openBanModal}
                          disabled={updatingFlags || selectedUser.is_admin}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-5 h-5" /> Edit Ban
                        </button>
                      </div>
                    ) : (!userFlags.can_topup || !userFlags.can_purchase || !userFlags.can_update_profile) ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => handleUpdateFlags({ 
                            is_banned: false, 
                            can_topup: true, 
                            can_purchase: true, 
                            can_update_profile: true,
                            ban_expires_at: null,
                            ban_reason: null
                          })}
                          disabled={updatingFlags}
                          className="flex-[2] flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Unrestrict
                        </button>
                        <button 
                          onClick={openRestrictModal}
                          disabled={updatingFlags || selectedUser.is_admin}
                          className="flex-1 flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-5 h-5" /> Edit
                        </button>
                        <button 
                          onClick={openBanModal}
                          disabled={updatingFlags || selectedUser.is_admin}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-5 h-5" /> Ban
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={openRestrictModal}
                          disabled={updatingFlags || selectedUser.is_admin}
                          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-5 h-5" /> RESTRICT USER
                        </button>
                        
                        <button 
                          onClick={openBanModal}
                          disabled={updatingFlags || selectedUser.is_admin}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-sm font-black transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-5 h-5" /> BAN USER
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={() => alert("Wiping data requires calling Supabase Auth admin API. This is a placeholder for future implementation.")}
                      disabled={updatingFlags || selectedUser.is_admin}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-gray-500 border border-transparent py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account Data
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 text-center mt-4 uppercase tracking-widest font-bold">These actions are absolute</p>
                </div>

              </div>

            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAN MODAL */}
      {isBanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0a] w-full max-w-md rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="p-6 border-b border-white/5 relative">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <UserX className="w-5 h-5 text-red-500" />
                </div>
                Suspend User
              </h2>
            </div>
            
            <div className="p-6 space-y-5 relative">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Target User</label>
                <div className="text-sm font-bold text-white bg-[#141414] px-4 py-3 rounded-xl border border-white/5">
                  {selectedUser.display_name || selectedUser.email}
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Ban Duration</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setBanDuration('permanent')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === 'permanent' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    Permanent
                  </button>
                  <button 
                    onClick={() => setBanDuration('7d')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === '7d' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    7 Days
                  </button>
                  <button 
                    onClick={() => setBanDuration('30d')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === '30d' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    30 Days
                  </button>
                  <button 
                    onClick={() => setBanDuration('90d')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === '90d' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    90 Days
                  </button>
                  <button 
                    onClick={() => setBanDuration('1y')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === '1y' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    1 Year
                  </button>
                  <button 
                    onClick={() => setBanDuration('custom')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${banDuration === 'custom' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    Custom (Days)
                  </button>
                </div>
                {banDuration === 'custom' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Days from now</label>
                      <input 
                        type="number" 
                        min="1"
                        max="3650"
                        value={customBanDays}
                        onChange={(e) => updateBanDays(e.target.value)}
                        className="w-full bg-[#141414] border border-red-500/30 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-red-500/70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Exact Date</label>
                      <input 
                        type="date" 
                        value={customBanDate}
                        onChange={(e) => updateBanDate(e.target.value)}
                        className="w-full bg-[#141414] border border-red-500/30 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-red-500/70"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Reason for Suspension</label>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Ban Evasion', 'Fraud / Scam', 'Chargeback', 'Toxic Behavior', 'Multiple accounts'].map(tag => (
                    <button 
                      type="button"
                      key={tag}
                      onClick={() => setBanReason(tag)}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Violation of Terms of Service, fraudulent activity..."
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none h-24"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#141414] flex justify-end gap-3">
              <button 
                onClick={() => setIsBanModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  let expiresAt = null;
                  if (banDuration === 'custom') {
                    const days = parseInt(customBanDays, 10);
                    if (isNaN(days) || days <= 0) {
                      alert("Please enter a valid number of days.");
                      return;
                    }
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    expiresAt = d.toISOString();
                  } else if (banDuration !== 'permanent') {
                    const d = new Date();
                    if (banDuration === '7d') d.setDate(d.getDate() + 7);
                    else if (banDuration === '30d') d.setDate(d.getDate() + 30);
                    else if (banDuration === '90d') d.setDate(d.getDate() + 90);
                    else if (banDuration === '1y') d.setFullYear(d.getFullYear() + 1);
                    expiresAt = d.toISOString();
                  }
                  
                  handleUpdateFlags({ 
                    is_banned: true, 
                    can_topup: false, 
                    can_purchase: false, 
                    can_update_profile: false,
                    ban_reason: banReason || 'No reason provided',
                    ban_type: 'manual',
                    ban_expires_at: expiresAt,
                    ban_acknowledged: false
                  });
                  setIsBanModalOpen(false);
                }}
                disabled={updatingFlags}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] disabled:opacity-50"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTRICT MODAL */}
      {isRestrictModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0a] w-full max-w-md rounded-2xl border border-orange-500/20 shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)] relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="p-6 border-b border-white/5 relative">
              <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                Restrict User
              </h2>
            </div>
            
            <div className="p-6 space-y-5 relative">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Target User</label>
                <div className="text-sm font-bold text-white bg-[#141414] px-4 py-3 rounded-xl border border-white/5">
                  {selectedUser.display_name || selectedUser.email}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Select Restrictions</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">Block Top-ups</div>
                      <div className="text-[10px] text-gray-500">Prevent adding balance</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${!restrictFlags.can_topup ? 'bg-orange-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${!restrictFlags.can_topup ? 'right-1' : 'left-1 bg-gray-400'}`}></div>
                    </div>
                    <input type="checkbox" className="hidden" checked={!restrictFlags.can_topup} onChange={(e) => setRestrictFlags({ ...restrictFlags, can_topup: !e.target.checked })} />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">Block Purchases</div>
                      <div className="text-[10px] text-gray-500">Prevent buying products</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${!restrictFlags.can_purchase ? 'bg-orange-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${!restrictFlags.can_purchase ? 'right-1' : 'left-1 bg-gray-400'}`}></div>
                    </div>
                    <input type="checkbox" className="hidden" checked={!restrictFlags.can_purchase} onChange={(e) => setRestrictFlags({ ...restrictFlags, can_purchase: !e.target.checked })} />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">Block Profile Updates</div>
                      <div className="text-[10px] text-gray-500">Prevent changing avatar/nick</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${!restrictFlags.can_update_profile ? 'bg-orange-500' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${!restrictFlags.can_update_profile ? 'right-1' : 'left-1 bg-gray-400'}`}></div>
                    </div>
                    <input type="checkbox" className="hidden" checked={!restrictFlags.can_update_profile} onChange={(e) => setRestrictFlags({ ...restrictFlags, can_update_profile: !e.target.checked })} />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Restriction Duration</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setRestrictDuration('permanent')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${restrictDuration === 'permanent' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    Permanent
                  </button>
                  <button 
                    onClick={() => setRestrictDuration('7d')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${restrictDuration === '7d' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    7 Days
                  </button>
                  <button 
                    onClick={() => setRestrictDuration('30d')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${restrictDuration === '30d' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    30 Days
                  </button>
                  <button 
                    onClick={() => setRestrictDuration('custom')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all border flex-1 min-w-[80px] ${restrictDuration === 'custom' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-[#141414] border-white/5 text-gray-400 hover:bg-white/5'}`}
                  >
                    Custom (Days)
                  </button>
                </div>
                {restrictDuration === 'custom' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Days from now</label>
                      <input 
                        type="number" 
                        min="1"
                        max="3650"
                        value={customRestrictDays}
                        onChange={(e) => updateRestrictDays(e.target.value)}
                        className="w-full bg-[#141414] border border-orange-500/30 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-orange-500/70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold mb-1 block uppercase">Exact Date</label>
                      <input 
                        type="date" 
                        value={customRestrictDate}
                        onChange={(e) => updateRestrictDate(e.target.value)}
                        className="w-full bg-[#141414] border border-orange-500/30 rounded-xl py-2 px-3 text-white text-sm font-bold focus:outline-none focus:border-orange-500/70"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Reason for Restriction</label>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Chargeback', 'Suspicious Activity', 'Pending Verification'].map(tag => (
                    <button 
                      type="button"
                      key={tag}
                      onClick={() => setRestrictReason(tag)}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  value={restrictReason}
                  onChange={(e) => setRestrictReason(e.target.value)}
                  placeholder="e.g. Chargeback detected, pending identity verification..."
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-orange-500/50 resize-none h-24"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#141414] flex justify-end gap-3">
              <button 
                onClick={() => setIsRestrictModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  let expiresAt = null;
                  if (restrictDuration === 'custom') {
                    const days = parseInt(customRestrictDays, 10);
                    if (isNaN(days) || days <= 0) {
                      alert("Please enter a valid number of days.");
                      return;
                    }
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    expiresAt = d.toISOString();
                  } else if (restrictDuration !== 'permanent') {
                    const d = new Date();
                    if (restrictDuration === '7d') d.setDate(d.getDate() + 7);
                    else if (restrictDuration === '30d') d.setDate(d.getDate() + 30);
                    expiresAt = d.toISOString();
                  }
                  
                  handleUpdateFlags({ 
                    is_banned: false, 
                    can_topup: restrictFlags.can_topup, 
                    can_purchase: restrictFlags.can_purchase, 
                    can_update_profile: restrictFlags.can_update_profile,
                    ban_reason: restrictReason || 'Account restricted by administrator',
                    ban_type: 'manual',
                    ban_expires_at: expiresAt,
                    ban_acknowledged: false
                  });
                  setIsRestrictModalOpen(false);
                }}
                disabled={updatingFlags}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] disabled:opacity-50"
              >
                Apply Restrictions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
