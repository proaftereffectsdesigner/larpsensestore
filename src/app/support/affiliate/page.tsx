"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { UserPlus, Image as ImageIcon, ChevronLeft, Loader2, Upload, ExternalLink } from "lucide-react";
import Link from "next/link";
import TicketChat from "@/components/TicketChat";

export default function AffiliateApplicationPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [affPlatforms, setAffPlatforms] = useState<string[]>([]);
  const [affStats, setAffStats] = useState<Record<string, any>>({});
  const [affSubmitting, setAffSubmitting] = useState(false);
  const [affActiveChat, setAffActiveChat] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setSessionToken(session.access_token);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);
        
        // Check if user already has an open affiliate ticket
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('issue_type', 'affiliate_application')
          .neq('status', 'closed')
          .order('created_at', { ascending: false });
          
        if (tickets && tickets.length > 0) {
          setAffActiveChat({ id: tickets[0].ticket_number.toString(), isNew: false });
        }
      }
    };
    fetchUser();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, platform: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large! Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setAffStats(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          screenshots: [...(prev[platform]?.screenshots || []), base64Data]
        }
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveScreenshot = (platform: string, index: number) => {
    setAffStats(prev => {
      const newScreenshots = [...(prev[platform]?.screenshots || [])];
      newScreenshots.splice(index, 1);
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          screenshots: newScreenshots
        }
      };
    });
  };

  const handleAffiliateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (affPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    for (const p of affPlatforms) {
      const s = affStats[p];
      if (!s.channelLink || !s.subs) {
        toast.error(`Please fill out required fields for ${p}`);
        return;
      }
      if (!s.screenshots || s.screenshots.length === 0) {
        toast.error(`Please upload at least one analytics screenshot for ${p}`);
        return;
      }
    }

    setAffSubmitting(true);
    
    let description = `**Affiliate Application**\n\n`;
    description += `**Platforms:** ${affPlatforms.join(", ")}\n\n`;
    
    let allAttachments: string[] = [];

    affPlatforms.forEach(p => {
      const stats = affStats[p];
      if (stats.screenshots) {
        allAttachments = [...allAttachments, ...stats.screenshots];
      }
      description += `**--- ${p} ---**\n`;
      description += `**Channel Link:** ${stats.channelLink}\n`;
      description += `**Followers/Subscribers:** ${stats.subs}\n`;
      if (p === 'YouTube') {
        description += `**Avg Long Video Views:** ${stats.longViews}\n`;
        description += `**Avg Shorts Views:** ${stats.shortsViews}\n`;
      }
      if (p === 'TikTok') {
        description += `**Avg TikTok Views:** ${stats.longViews}\n`;
      }
      if (stats.liveViewers) description += `**Average Live Viewers:** ${stats.liveViewers}\n`;
      description += `\n`;
    });

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          issueType: "affiliate_application",
          description: description,
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Affiliate application submitted successfully!");
        setAffActiveChat({
          id: data.ticket_number.toString(),
          description,
          attachments: allAttachments,
          isNew: true
        });
        setAffPlatforms([]);
        setAffStats({});
      } else {
        toast.error(data.error || "Failed to submit application");
      }
    } catch (err: any) {
      toast.error("Failed to submit application");
    } finally {
      setAffSubmitting(false);
    }
  };

  if (!isMounted) return null;

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 text-center max-w-lg mx-auto shadow-none">
          <UserPlus className="w-12 h-12 text-[#f5f5f7]/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#f5f5f7] mb-2">Login Required</h2>
          <p className="text-[#f5f5f7]/50 mb-6 text-sm">You must be logged in to apply for the affiliate partnership.</p>
          <button 
            onClick={() => window.dispatchEvent(new Event('open-auth'))}
            className="px-6 py-3 bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black font-bold uppercase tracking-widest text-xs transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 bg-[#050505]">
      <div className="w-full max-w-4xl mt-24 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="mb-6 flex items-center justify-between">
          <Link href="/support" className="text-[#f5f5f7]/50 hover:text-[#f5f5f7] flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Support
          </Link>
        </div>

        {affActiveChat ? (
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#262626] p-6 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#f5f5f7]">Application Under Review</h2>
                <p className="text-sm text-[#f5f5f7]/60 mt-1">We've received your application. Chat with our team below if you have any questions or need to provide more info.</p>
              </div>
            </div>
            <TicketChat 
              sessionId={affActiveChat.id} 
              initialMessage={affActiveChat.isNew ? affActiveChat.description : undefined} 
              initialAttachments={affActiveChat.isNew ? affActiveChat.attachments : undefined}
              onCloseTicket={async () => {
                if (affActiveChat?.id) {
                  try {
                    await fetch("/api/tickets/close", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionToken}`
                      },
                      body: JSON.stringify({ ticketId: affActiveChat.id })
                    });
                  } catch (e) {}
                }
                setAffActiveChat(null);
                window.location.reload();
              }}
              userAvatar={profile?.avatar_url || user?.user_metadata?.avatar_url}
              userName={profile?.display_name || user?.user_metadata?.username || user?.user_metadata?.name || user?.email?.split('@')?.[0] || 'User'}
            />
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-8 shadow-none relative overflow-hidden">
            <h2 className="text-2xl font-bold text-[#f5f5f7] mb-2 uppercase tracking-widest">[ Affiliate Application ]</h2>
            <p className="text-[#f5f5f7]/60 text-sm mb-10 max-w-2xl leading-relaxed">
              Join our affiliate program and earn commissions on every sale you bring. Fill out the application below and we will get back to you via a live Discord ticket.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 relative z-10">
              <div className="bg-[#141414] border border-[#262626] p-6 rounded-xl">
                <div className="text-accent text-3xl font-black mb-1 tracking-tighter">10%</div>
                <div className="text-xs font-bold text-[#f5f5f7] uppercase tracking-widest mb-2">[ Your Commission ]</div>
                <p className="text-xs text-[#f5f5f7]/50 leading-relaxed">You earn a flat 10% cut on every single order made by a client who has ever used your code, forever. Once a user applies your code, they are permanently assigned to you.</p>
              </div>
              <div className="bg-[#141414] border border-[#262626] p-6 rounded-xl">
                <div className="text-[#3b82f6] text-3xl font-black mb-1 tracking-tighter">10%</div>
                <div className="text-xs font-bold text-[#f5f5f7] uppercase tracking-widest mb-2">[ User Discount ]</div>
                <p className="text-xs text-[#f5f5f7]/50 leading-relaxed">Your audience receives a one-time 10% discount on their first deposit or purchase. After using it, they cannot apply the code again, but they remain your assigned referral.</p>
              </div>
            </div>
            
            <form onSubmit={handleAffiliateSubmit} className="space-y-8 relative z-10">
              
              {/* Platforms Selection */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#f5f5f7]/50 uppercase">Primary Platforms</label>
                <p className="text-[#f5f5f7]/30 text-[10px] uppercase tracking-widest mb-3 mt-1">( You can select multiple platforms )</p>
                <div className="flex flex-wrap gap-3">
                  {['YouTube', 'TikTok', 'Kick / Twitch'].map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => {
                        if (affPlatforms.includes(platform)) {
                          setAffPlatforms(prev => prev.filter(p => p !== platform));
                          const newStats = {...affStats};
                          delete newStats[platform];
                          setAffStats(newStats);
                        } else {
                          setAffPlatforms(prev => [...prev, platform]);
                          setAffStats(prev => ({ ...prev, [platform]: { channelLink: '', subs: '', longViews: '', shortsViews: '', liveViewers: '', screenshots: [] } }));
                        }
                      }}
                      className={`px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-bold border transition-colors ${
                        affPlatforms.includes(platform)
                          ? 'bg-accent border-accent text-black'
                          : 'bg-[#141414] border-[#262626] text-[#f5f5f7]/60 hover:bg-[#1a1a1a] hover:text-[#f5f5f7]'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Form Fields per Platform */}
              {affPlatforms.map(platform => (
                <div key={platform} className="bg-[#141414] border border-[#262626] rounded-none p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-sm font-bold text-accent mb-6 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full" /> {platform} Requirements
                  </h4>
                  <div className="space-y-5">
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">Channel Link <span className="text-[#ff3333]">*</span></label>
                      <input 
                        type="url" 
                        required
                        value={affStats[platform]?.channelLink || ''}
                        onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], channelLink: e.target.value}}))}
                        placeholder={`https://${platform.toLowerCase().replace(/ \/ /g, '')}.com/...`}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">{platform === 'Kick / Twitch' ? 'Followers' : 'Subscribers'} <span className="text-[#ff3333]">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={affStats[platform]?.subs || ''}
                        onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], subs: e.target.value}}))}
                        placeholder="e.g. 10.5k"
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>

                    {platform === 'YouTube' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">Avg. Long Video Views</label>
                          <input 
                            type="text" 
                            value={affStats[platform]?.longViews || ''}
                            onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], longViews: e.target.value}}))}
                            placeholder="e.g. 5k"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">Avg. Shorts Views</label>
                          <input 
                            type="text" 
                            value={affStats[platform]?.shortsViews || ''}
                            onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], shortsViews: e.target.value}}))}
                            placeholder="e.g. 20k"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {platform === 'TikTok' && (
                      <div>
                        <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">Avg. Views per video</label>
                        <input 
                          type="text" 
                          value={affStats[platform]?.longViews || ''}
                          onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], longViews: e.target.value}}))}
                          placeholder="e.g. 10k"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    )}

                    {platform === 'Kick / Twitch' && (
                      <div>
                        <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-2 uppercase tracking-wider">Avg. Live Viewers (CCV)</label>
                        <input 
                          type="text" 
                          value={affStats[platform]?.liveViewers || ''}
                          onChange={(e) => setAffStats(prev => ({...prev, [platform]: {...prev[platform], liveViewers: e.target.value}}))}
                          placeholder="e.g. 150"
                          className="w-full bg-[#0a0a0a] border border-[#262626] rounded-none px-4 py-3 text-[#f5f5f7] text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-[#f5f5f7]/50 mb-3 uppercase tracking-wider mt-6">Analytics Screenshots <span className="text-[#ff3333]">*</span></label>
                      <div className="flex flex-wrap gap-4">
                        {affStats[platform]?.screenshots?.map((src: string, idx: number) => (
                          <div key={idx} className="relative group w-24 h-24 rounded-sm overflow-hidden border border-[#262626]">
                            <img src={src} alt="Analytics proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#000000]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveScreenshot(platform, idx)}
                                className="text-[#ff3333] hover:text-[#ff0000] text-xs font-bold uppercase tracking-widest"
                              >
                                [ RM ]
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <label className="w-24 h-24 flex flex-col items-center justify-center bg-[#0a0a0a] border border-[#262626] hover:bg-[#1a1a1a] transition-colors rounded-sm cursor-pointer border-dashed">
                          <Upload className="w-5 h-5 text-[#f5f5f7]/30 mb-2" />
                          <span className="text-[10px] text-[#f5f5f7]/50 font-bold uppercase tracking-widest">Upload</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, platform)} />
                        </label>
                      </div>
                      <p className="text-[10px] text-[#ff3333] mt-3 font-bold uppercase tracking-wider bg-[#1a0a0a] border border-[#ff3333] p-2.5 flex items-start gap-2">
                        <span>[!]</span>
                        <span>You must provide screenshots proving that the account belongs to you and the views/stats are yours (e.g. YouTube Studio / TikTok Analytics).</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="submit" 
                disabled={affSubmitting}
                className="w-full bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {affSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Submit Application</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
