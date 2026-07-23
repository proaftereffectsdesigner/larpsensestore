"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase-client";

interface PresenceContextType {
  onlineUsers: Record<string, any>;
  isReady: boolean;
}

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: {}, isReady: false });

export const usePresence = () => useContext(PresenceContext);

export default function PresenceTracker({ children }: { children?: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const initPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Track instant online status via WebSockets
      channel = supabase.channel('online_users', {
        config: {
          presence: {
            key: session?.user?.id || 'anonymous_' + Math.random(),
          },
        },
      });

      channel.on('presence', { event: 'sync' }, () => {
        setOnlineUsers(channel.presenceState());
        setIsReady(true);
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && session) {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

      // Still update the database last_seen so offline users have an accurate "last seen X mins ago"
      updatePresence();
    };

    const updatePresence = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        await fetch("/api/sync-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ userId: session.user.id })
        });
      } catch (e) {
        console.error("Sync check failed", e);
      }
    };

    initPresence();
    const interval = setInterval(updatePresence, 300000); // 5 mins

    // Unload hook
    const handleBeforeUnload = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;
        // Best effort synchronous ping
        fetch("/api/sync-state", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ userId: session.user.id }),
        }).catch(() => {});
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, isReady }}>
      {children}
    </PresenceContext.Provider>
  );
}
