"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { History, ArrowRight, Wallet, ChevronDown } from "lucide-react";
import LSCoinIcon from "@/components/LSCoinIcon";
import { supabase } from "@/lib/supabase-client";
import { playCaseUnlockSound, playRouletteTickSound, playCaseWinSound } from "@/lib/rewardSounds";

interface CaseItem {
  id: number;
  name: string;
  amount: number;
  type: string;
  color: string;
  border: string;
  glowColor: string;
  textColor: string;
}

export const POSSIBLE_DROPS: CaseItem[] = [
  // Szara (Gray) - 60%
  { id: 1, name: "1 LSC", amount: 1, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 2, name: "2 LSC", amount: 2, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 3, name: "3 LSC", amount: 3, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 4, name: "4 LSC", amount: 4, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  { id: 5, name: "5 LSC", amount: 5, type: "coin", color: "bg-gray-500", border: "border-gray-500", glowColor: "rgba(107,114,128,0.4)", textColor: "#9ca3af" },
  // Niebieska (Blue) - 25%
  { id: 6, name: "10 LSC", amount: 10, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 7, name: "15 LSC", amount: 15, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 8, name: "20 LSC", amount: 20, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  { id: 9, name: "25 LSC", amount: 25, type: "coin", color: "bg-blue-500", border: "border-blue-500", glowColor: "rgba(59,130,246,0.5)", textColor: "#60a5fa" },
  // Fioletowa (Purple) - 10%
  { id: 10, name: "50 LSC", amount: 50, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },
  { id: 11, name: "75 LSC", amount: 75, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },
  { id: 12, name: "100 LSC", amount: 100, type: "coin", color: "bg-purple-500", border: "border-purple-500", glowColor: "rgba(168,85,247,0.5)", textColor: "#c084fc" },
  // Rozowa (Pink) - 3.5%
  { id: 13, name: "250 LSC", amount: 250, type: "coin", color: "bg-pink-500", border: "border-pink-500", glowColor: "rgba(236,72,153,0.5)", textColor: "#f472b6" },
  { id: 14, name: "300 LSC", amount: 300, type: "coin", color: "bg-pink-500", border: "border-pink-500", glowColor: "rgba(236,72,153,0.5)", textColor: "#f472b6" },
  // Czerwona (Red) - 1.3%
  { id: 15, name: "700 LSC", amount: 700, type: "coin", color: "bg-red-500", border: "border-red-500", glowColor: "rgba(239,68,68,0.5)", textColor: "#f87171" },
  { id: 16, name: "800 LSC", amount: 800, type: "coin", color: "bg-red-500", border: "border-red-500", glowColor: "rgba(239,68,68,0.5)", textColor: "#f87171" },
  // Złoto (Gold) - 0.2%
  { id: 17, name: "1500 LSC", amount: 1500, type: "coin", color: "bg-yellow-500", border: "border-yellow-500", glowColor: "rgba(234,179,8,0.6)", textColor: "#facc15" },
];

function formatRelativeTime(isoOrDate: string): string {
  if (!isoOrDate) return "Just now";
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return typeof isoOrDate === "string" ? isoOrDate : "Recently";
  
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

const generateRouletteSequence = (winningItem: CaseItem, totalItems = 60) => {
  const sequence: CaseItem[] = [];
  for (let i = 0; i < totalItems; i++) {
    if (i === 45) { // The winner is at index 45
      sequence.push(winningItem);
    } else {
      const randIdx = Math.floor(Math.random() * POSSIBLE_DROPS.length);
      sequence.push(POSSIBLE_DROPS[randIdx]);
    }
  }
  return sequence;
};

export default function CasePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinFinished, setSpinFinished] = useState(false);
  const [justWonItem, setJustWonItem] = useState<CaseItem | null>(null);
  const [balance, setBalance] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Deterministic initial sequence for SSR
  const [sequence, setSequence] = useState<CaseItem[]>(() => {
    const seq = [];
    for (let i = 0; i < 60; i++) {
      seq.push(POSSIBLE_DROPS[i % POSSIBLE_DROPS.length]);
    }
    return seq;
  });

  const [winningItem, setWinningItem] = useState<CaseItem>(POSSIBLE_DROPS[0]);
  const [isWinFocused, setIsWinFocused] = useState(false);
  const winFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const tickRafRef = useRef<number | null>(null);

  const fetchCaseStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/rewards/case", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();

      if (data.ok) {
        setIsLoaded(true);
        setBalance(typeof data.balance === "number" ? data.balance : 0);
        setHistory(Array.isArray(data.history) ? data.history : []);
        const remSecs = Number(data.remainingSeconds || 0);
        setTimeLeft(remSecs);
      }
    } catch (err) {
      console.error("Failed to load case status:", err);
      setIsLoaded(true);
    }
  }, []);

  // Check auth and load real status
  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchCaseStatus(session.access_token);
      } else {
        setIsLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchCaseStatus(session.access_token);
      } else {
        setIsLoaded(true);
        setBalance(0);
        setHistory([]);
        setTimeLeft(0);
      }
    });

    return () => {
      if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
      if (winFocusTimeoutRef.current) clearTimeout(winFocusTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, [fetchCaseStatus]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const startSpin = async () => {
    if (isSpinning || timeLeft > 0) return;

    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth"));
      return;
    }

    try {
      if (winFocusTimeoutRef.current) clearTimeout(winFocusTimeoutRef.current);
      setIsWinFocused(false);
      setJustWonItem(null);
      setIsSpinning(true);
      setSpinFinished(false);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setIsSpinning(false);
        window.dispatchEvent(new CustomEvent("open-auth"));
        return;
      }

      // Roll on the server securely
      const res = await fetch("/api/rewards/case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setIsSpinning(false);
        if (data.remainingSeconds) {
          setTimeLeft(data.remainingSeconds);
        }
        if (typeof data.balance === "number") {
          setBalance(data.balance);
        }
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        }
        return;
      }

      // Server rolled winner
      const serverDrop = data.drop;
      const matchedWinner = POSSIBLE_DROPS.find(p => p.id === serverDrop.id) || POSSIBLE_DROPS[0];
      setWinningItem(matchedWinner);

      // Play authentic mechanical latch unlock sound
      playCaseUnlockSound();

      // Generate sequence with matched winner at index 45
      const newSequence = generateRouletteSequence(matchedWinner);
      setSequence(newSequence);

      // Reset roulette position
      if (rouletteRef.current) {
        rouletteRef.current.style.transition = "none";
        rouletteRef.current.style.transform = "translateX(0)";
      }

      // Start smooth spin animation
      setTimeout(() => {
        if (rouletteRef.current && rouletteRef.current.children[45]) {
          const targetItem = rouletteRef.current.children[45] as HTMLElement;
          const itemOffsetLeft = targetItem.offsetLeft;
          const itemCenter = itemOffsetLeft + (targetItem.offsetWidth / 2);
          const containerWidth = rouletteRef.current.parentElement!.clientWidth;

          // Offset for tension
          const maxOffset = targetItem.offsetWidth * 0.40;
          const randomOffset = (Math.random() * (maxOffset * 2)) - maxOffset;

          const initialTargetX = itemCenter - (containerWidth / 2) + randomOffset;
          const finalTargetX = itemCenter - (containerWidth / 2);

          // Force reflow
          void rouletteRef.current.offsetWidth;

          // 1. Initial Spin (5.5s)
          rouletteRef.current.style.transition = "transform 5.5s cubic-bezier(0.15, 0.9, 0.15, 1)";
          rouletteRef.current.style.transform = `translateX(-${initialTargetX}px)`;

          // Start synchronized deceleration ticking (CS:GO style)
          let lastTickIndex = -1;
          let lastTickTimestamp = 0;
          const spinStartTime = performance.now();

          const getTranslateX = (el: HTMLElement) => {
            try {
              const style = window.getComputedStyle(el);
              if (!style.transform || style.transform === "none") return 0;
              if (typeof DOMMatrixReadOnly !== "undefined") {
                return Math.abs(new DOMMatrixReadOnly(style.transform).m41);
              }
              const match = style.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
              return match ? Math.abs(parseFloat(match[1])) : 0;
            } catch {
              return 0;
            }
          };

          const runTicker = (now: number) => {
            if (!rouletteRef.current) return;
            const elapsed = now - spinStartTime;
            if (elapsed >= 5500) return;

            const currentOffset = getTranslateX(rouletteRef.current);
            // Each card is w-40 (160px) + gap-4 (16px) = 176px
            const currentIndex = Math.floor((currentOffset + 88) / 176);

            if (currentIndex !== lastTickIndex) {
              if (now - lastTickTimestamp >= 70) {
                playRouletteTickSound();
                lastTickTimestamp = now;
                lastTickIndex = currentIndex;
              }
            }

            tickRafRef.current = requestAnimationFrame(runTicker);
          };

          if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
          tickRafRef.current = requestAnimationFrame(runTicker);

          // 2. Snap to center
          setTimeout(() => {
            if (rouletteRef.current) {
              rouletteRef.current.style.transition = "transform 0.5s ease-in-out";
              rouletteRef.current.style.transform = `translateX(-${finalTargetX}px)`;
            }
          }, 5500);
        }
      }, 100);

      // Spin finished: automatically apply rewards without any popup or collect click
      setTimeout(() => {
        if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
        playCaseWinSound(matchedWinner.amount >= 250);

        setIsSpinning(false);
        setSpinFinished(true);
        setJustWonItem(matchedWinner);
        setIsWinFocused(true);

        if (typeof data.newBalance === "number") {
          setBalance(data.newBalance);
        }
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        }
        setTimeLeft(data.cooldownSeconds || 24 * 60 * 60);

        // Auto-dismiss the winner highlight blur & the "You won" pill after 4.5 seconds
        if (winFocusTimeoutRef.current) clearTimeout(winFocusTimeoutRef.current);
        winFocusTimeoutRef.current = setTimeout(() => {
          setIsWinFocused(false);
          setJustWonItem(null);
        }, 4500);
      }, 6000);

    } catch (err) {
      console.error("Error executing case spin:", err);
      if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
      setIsSpinning(false);
    }
  };

  return (
    <div className="w-full mx-auto px-6 relative z-10 flex flex-col xl:flex-row gap-8 items-start justify-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left Sidebar: Balance & Mini Shop */}
      <div className="hidden xl:flex w-[350px] shrink-0 flex-col bg-[#0a0a0a] border border-[#262626] rounded-sm overflow-hidden sticky top-32">
        <div className="p-5 border-b border-[#262626] bg-[#0a0a0a]">
          <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            Your Balance
          </h3>
        </div>
        <div className="p-8 flex flex-col items-center justify-center gap-4 bg-[#141414]/50">
          <LSCoinIcon className="w-20 h-20" color="#47c92f" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-white tracking-wider mb-1">
              {mounted ? balance.toLocaleString() : 0} <span className="text-xl text-accent">LSC</span>
            </span>
            <span className="text-[#737373] font-medium text-[10px] uppercase tracking-[0.2em]">Available to spend</span>
          </div>
        </div>

        {/* Go to Shop & Expandable Mini Shop */}
        <div className="p-4 border-t border-[#262626] bg-[#0a0a0a] flex flex-col gap-3">
          <button 
            type="button"
            onClick={() => setIsShopOpen(!isShopOpen)}
            className="w-full bg-[#1c1c1c] border border-[#262626] text-[#f5f5f7] font-bold uppercase tracking-[0.2em] text-xs px-4 py-3 rounded-sm hover:bg-[#262626] hover:border-[#404040] transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Go to Shop</span>
            <ChevronDown className={`w-4 h-4 text-accent transition-transform duration-300 ${isShopOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expandable Mini Shop Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isShopOpen ? 'max-h-[140px] opacity-100 pt-1' : 'max-h-0 opacity-0'}`}>
            <div className="bg-[#141414] border border-[#262626] rounded-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-white font-black uppercase tracking-[0.2em] text-[11px]">
                  LSC Shop
                </span>
                <span className="text-[#737373] text-[10px] font-bold uppercase tracking-[0.2em]">
                  Coming Soon
                </span>
              </div>

              <p className="text-[#8e8e93] text-xs leading-relaxed">
                Something will be added here in the future. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Column */}
      <div className="flex-1 w-full max-w-5xl flex flex-col items-center mx-auto">
        
        {/* The Roulette Container */}
        <div className="w-full bg-[#141414] border-y-2 border-[#262626] py-12 relative overflow-hidden shadow-2xl mb-8">
          
          {/* Fade edges */}
          <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-[#141414] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-[#141414] to-transparent z-10 pointer-events-none"></div>
          
          {/* Center Line Marker */}
          <div 
            className={`absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 z-20 pointer-events-none transition-all duration-500 ${
              isWinFocused ? 'w-[3px] shadow-[0_0_15px_rgba(71,201,47,0.8)]' : 'bg-accent'
            }`}
            style={isWinFocused && justWonItem ? { backgroundColor: justWonItem.textColor, boxShadow: `0 0 15px ${justWonItem.textColor}` } : undefined}
          />

          {/* The Track */}
          <div 
            ref={rouletteRef}
            className="flex gap-4 items-center relative"
            style={{ width: "max-content", transform: "translateX(0)" }}
          >
            {sequence.map((item, idx) => {
              const isWinnerCard = idx === 45;
              const isBlurred = isWinFocused && !isWinnerCard;
              const isWinnerHighlight = isWinFocused && isWinnerCard;

              return (
                <div 
                  key={idx} 
                  className={`w-40 h-40 shrink-0 bg-[#0a0a0a] rounded-sm flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-700 ${
                    isWinnerHighlight
                      ? 'scale-105 z-20 border-2 shadow-[0_0_35px_rgba(0,0,0,0.85)]'
                      : isBlurred
                      ? 'border border-[#1f1f1f] opacity-25 blur-[3.5px] scale-95'
                      : 'border-2 border-[#262626]'
                  }`}
                  style={isWinnerHighlight ? {
                    borderColor: item.textColor,
                    boxShadow: `0 0 35px ${item.textColor}50, inset 0 0 15px ${item.textColor}25`
                  } : undefined}
                >
                  {/* CS:GO Rarity Bar & Glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-[6px]" style={{ backgroundColor: item.textColor }}></div>
                  <div 
                    className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-all duration-700 ${
                      isWinnerHighlight ? 'h-32 opacity-40' : 'h-24 opacity-20'
                    }`} 
                    style={{ background: `linear-gradient(to top, ${item.textColor}, transparent)` }}
                  ></div>
                  
                  <LSCoinIcon 
                    className={`w-12 h-12 mb-3 relative z-10 transition-transform duration-500 ${
                      isWinnerHighlight ? 'scale-110 drop-shadow-[0_0_15px_rgba(71,201,47,0.5)]' : ''
                    }`} 
                    color={item.textColor} 
                  />
                  <span 
                    className={`font-bold tracking-wider relative z-10 transition-all duration-500 ${
                      isWinnerHighlight ? 'text-base font-black tracking-widest' : 'text-sm'
                    }`} 
                    style={{ color: item.textColor }}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Place Win Celebration Banner */}
        {justWonItem && (
          <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#141414] border border-[#262626] mb-6 animate-in fade-in zoom-in-95 duration-500 shadow-xl transition-all">
            <LSCoinIcon className="w-5 h-5 animate-pulse" color={justWonItem.textColor} />
            <span className="font-black text-xs uppercase tracking-[0.2em] text-[#f5f5f7]">
              You won <span style={{ color: justWonItem.textColor }}>{justWonItem.name}</span>!
            </span>
          </div>
        )}

        {/* Spin Button / Timer */}
        <div className="flex flex-col items-center mb-16">
          {timeLeft > 0 ? (
            <button 
              disabled
              className="bg-[#0a0a0a] border border-[#262626] text-[#737373] font-bold uppercase tracking-[0.2em] px-12 py-4 rounded-sm cursor-not-allowed"
            >
              NEXT DROP IN {formatTime(timeLeft)}
            </button>
          ) : (
            <button 
              onClick={startSpin}
              disabled={isSpinning || spinFinished || !isLoaded}
              className="bg-accent border border-accent text-[#0a0a0a] font-black uppercase tracking-[0.2em] px-12 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSpinning ? "Rolling..." : "Open Case (Free)"}
            </button>
          )}
        </div>

        {/* What's in the case */}
        <div className="w-full">
          <h3 className="text-white font-black uppercase tracking-widest text-lg mb-6 flex items-center gap-3 border-b border-[#262626] pb-4">
            What's inside
            <ArrowRight className="w-4 h-4 text-accent" />
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[...POSSIBLE_DROPS].reverse().map((drop) => (
              <div key={drop.id} className="bg-[#0a0a0a] border border-[#262626] rounded-sm p-4 flex flex-col items-center justify-center hover:border-[#404040] transition-colors relative overflow-hidden group">
                {/* CS:GO Rarity Bar & Glow */}
                <div className="absolute bottom-0 left-0 right-0 h-[4px]" style={{ backgroundColor: drop.textColor }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-[0.15] pointer-events-none group-hover:opacity-30 transition-opacity" style={{ background: `linear-gradient(to top, ${drop.textColor}, transparent)` }}></div>
                
                <LSCoinIcon className="w-8 h-8 mb-3 opacity-40 group-hover:opacity-80 transition-opacity relative z-10" color={drop.textColor} />
                <span className="font-bold text-xs uppercase tracking-widest text-center relative z-10" style={{ color: drop.textColor }}>{drop.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Sidebar: Real Drop History */}
      <div className="hidden xl:flex w-[350px] shrink-0 flex-col bg-[#0a0a0a] border border-[#262626] rounded-sm overflow-hidden sticky top-32">
        <div className="p-5 border-b border-[#262626] bg-[#0a0a0a]">
          <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            Your History
          </h3>
        </div>
        <div className="flex flex-col p-3 gap-3 max-h-[700px] overflow-y-auto custom-scrollbar">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <History className="w-8 h-8 mb-2 opacity-25 text-accent" />
              <span className="text-xs uppercase tracking-widest font-semibold text-gray-400">No Drops Yet</span>
              <p className="text-[11px] text-gray-600 mt-1">Open your first daily case to start recording your history.</p>
            </div>
          ) : (
            history.map((log: any) => {
              const dropData = log.drop || {};
              const textColor = dropData.textColor || "#9ca3af";
              const dropName = dropData.name || `${dropData.amount || 1} LSC`;
              const displayTime = formatRelativeTime(log.time);

              return (
                <div key={log.id} className="flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-sm hover:border-[#404040] transition-all relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: textColor }}></div>
                  <LSCoinIcon className="w-8 h-8 shrink-0" color={textColor} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span style={{ color: textColor }} className="font-bold text-xs uppercase tracking-widest truncate">
                        {dropName}
                      </span>
                      <span className="text-xs text-[#f5f5f7]/40 shrink-0 font-medium">{displayTime}</span>
                    </div>
                    <span className="text-[#737373] font-medium text-[10px] uppercase tracking-widest truncate">
                      Daily Reward Case
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
