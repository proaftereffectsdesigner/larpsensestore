"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, Check, Lock, Clock, Gift, ArrowRight } from "lucide-react";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";
import { supabase } from "@/lib/supabase-client";
import { playScratchFrictionSound, playCardWinSound } from "@/lib/rewardSounds";

interface CardDrop {
  id: number;
  name: string;
  discountPct: number;
  image: string;
  textColor: string;
  code?: string | null;
  status?: string;
  wonAt?: string;
}

const POSSIBLE_REWARDS = [
  { id: 4, name: "20% Discount", discountPct: 20, textColor: "#facc15", image: "/reward-legendary.png" },
  { id: 3, name: "15% Discount", discountPct: 15, textColor: "#c084fc", image: "/reward-epic.png" },
  { id: 2, name: "10% Discount", discountPct: 10, textColor: "#60a5fa", image: "/reward-rare.png" },
  { id: 1, name: "5% Discount", discountPct: 5, textColor: "#22c55e", image: "/reward-common.png" },
  { id: 0, name: "Empty", discountPct: 0, textColor: "#a1a1aa", image: "/reward-empty.png" },
];

function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface ScratchCardProps {
  width: number;
  height: number;
  isLocked: boolean;
  onStartScratch: () => void;
  onComplete: () => void;
  revealedImage?: string | null;
  drawKey: number;
}

interface ShavingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rotation: number;
  vRot: number;
  opacity: number;
  color: string;
}

const ScratchCardCanvas = ({
  width,
  height,
  isLocked,
  onStartScratch,
  onComplete,
  revealedImage,
  drawKey
}: ScratchCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ShavingParticle[]>([]);
  const particleRafRef = useRef<number | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const lastMoveTimeRef = useRef(0);
  const totalScratchedDistRef = useRef(0);

  // Redraw scratch layer whenever drawKey changes or component mounts
  useEffect(() => {
    setIsCompleted(false);
    setHasStarted(false);
    setIsDrawing(false);
    setLastPos(null);
    particlesRef.current = [];
    totalScratchedDistRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";

    const drawScratchLayer = (img: HTMLImageElement | null) => {
      const canvasWidth = width * 2;
      const canvasHeight = height * 2;

      if (img) {
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    };

    const img = new window.Image();
    img.src = "/karta-ls.png";
    img.onload = () => drawScratchLayer(img);
    img.onerror = () => drawScratchLayer(null);

    return () => {
      if (particleRafRef.current) cancelAnimationFrame(particleRafRef.current);
    };
  }, [width, height, drawKey]);

  // Particle animation loop for silver foil shavings
  const updateParticles = () => {
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.vx *= 0.96; // Air resistance
      p.rotation += p.vRot;
      p.opacity -= 0.028;

      if (p.opacity <= 0 || p.y > canvas.height) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (particles.length > 0) {
      particleRafRef.current = requestAnimationFrame(updateParticles);
    } else {
      particleRafRef.current = null;
    }
  };

  const spawnShavings = (x: number, y: number, vx: number, vy: number) => {
    const foilColors = ["#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#cbd5e1"];
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;
      particlesRef.current.push({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 16 - 8),
        vx: vx * 0.15 + Math.cos(angle) * speed,
        vy: vy * 0.15 + Math.sin(angle) * speed - 0.8,
        w: 2.5 + Math.random() * 3,
        h: 2 + Math.random() * 2.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.35,
        opacity: 0.95,
        color: foilColors[Math.floor(Math.random() * foilColors.length)],
      });
    }

    if (!particleRafRef.current) {
      particleRafRef.current = requestAnimationFrame(updateParticles);
    }
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = (width * 2) / rect.width;
    const scaleY = (height * 2) / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Check completion: require 28% of entire card (approx 70% of scratch box) AND at least 160px of movement
  const checkCompletion = () => {
    if (totalScratchedDistRef.current < 160) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, width * 2, height * 2);
    const data = imageData.data;
    let transparentCount = 0;
    let totalSamples = 0;

    // Fast step sampling (every 8th pixel)
    for (let i = 3; i < data.length; i += 32) {
      totalSamples++;
      if (data[i] === 0) transparentCount++;
    }

    if (transparentCount / totalSamples > 0.28) {
      setIsCompleted(true);
      onComplete();
    }
  };

  // Realistic textured scratch brush: authentic chunky coin scrape with ragged latex edge flaking
  const scrapeLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(dist / 8));
    const baseRadius = 52; // Chunky coin contact diameter (satisfying clear swaths)

    ctx.globalCompositeOperation = "destination-out";

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;

      // Central coin scrape circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Jagged micro-flaking along perimeter (simulates physical latex tearing)
      for (let j = 0; j < 3; j++) {
        const angle = Math.random() * Math.PI * 2;
        const offset = baseRadius * (0.72 + Math.random() * 0.38);
        const jx = cx + Math.cos(angle) * offset;
        const jy = cy + Math.sin(angle) * offset;
        const jr = 6 + Math.random() * 10;

        ctx.beginPath();
        ctx.arc(jx, jy, jr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handleStart = (e: any) => {
    if (isLocked || isCompleted) return;
    if (!hasStarted) {
      setHasStarted(true);
      onStartScratch();
    }
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setLastPos(coords);
    lastMoveTimeRef.current = performance.now();

    // Initial coin touch imprint (do NOT check completion on single touch)
    if (coords) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        scrapeLine(ctx, coords.x, coords.y, coords.x, coords.y);
        spawnShavings(coords.x, coords.y, 0, -1);
        playScratchFrictionSound(1.2);
      }
    }
  };

  const handleMove = (e: any) => {
    if (!isDrawing || isCompleted || isLocked) return;
    if (e.cancelable && e.type.includes("touch")) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const currentPos = getCoordinates(e);
    if (!currentPos || !lastPos) return;

    // Draw realistic coin scrape
    scrapeLine(ctx, lastPos.x, lastPos.y, currentPos.x, currentPos.y);

    // Particle shavings & scrape sound
    const now = performance.now();
    const dt = Math.max(1, now - lastMoveTimeRef.current);
    const dx = currentPos.x - lastPos.x;
    const dy = currentPos.y - lastPos.y;
    const dist = Math.hypot(dx, dy);

    totalScratchedDistRef.current += dist;

    spawnShavings(currentPos.x, currentPos.y, dx / (dt || 16), dy / (dt || 16));

    const intensity = Math.min(2.5, Math.max(0.6, (dist / dt) * 1.6));
    playScratchFrictionSound(intensity);
    lastMoveTimeRef.current = now;

    setLastPos(currentPos);

    if (Math.random() < 0.45) {
      checkCompletion();
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setLastPos(null);
    if (!isCompleted && hasStarted) {
      checkCompletion();
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-[22px] w-full h-full select-none ${isLocked ? "cursor-not-allowed" : "cursor-crosshair"}`}>
      {/* Revealed Image under canvas */}
      <div className="absolute inset-0 z-0">
        {revealedImage ? (
          <Image
            src={revealedImage}
            fill
            alt="Reward Card"
            className="object-contain pointer-events-none"
            sizes="315px"
            priority
          />
        ) : (
          <div className="w-full h-full bg-transparent flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-accent/40 animate-ping" />
          </div>
        )}
      </div>

      {/* Scratch Layer */}
      <canvas
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
        className={`absolute inset-0 w-full h-full z-10 touch-none transition-opacity duration-700 ${
          isCompleted ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${isLocked ? "pointer-events-none" : ""}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Realistic Silver Shavings Particle Overlay */}
      <canvas
        ref={particlesCanvasRef}
        width={width * 2}
        height={height * 2}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
      />
    </div>
  );
};

const getInitialCache = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("larpsense_scratch_cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const expiresAt = new Date(parsed.cooldownUntil).getTime();
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    if (remaining > 0 && parsed.activeCard) {
      return {
        activeCard: parsed.activeCard,
        remainingSeconds: remaining,
        canScratch: false,
        isScratched: true,
      };
    }
  } catch {}
  return null;
};

export default function CardPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [canScratch, setCanScratch] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [winningCard, setWinningCard] = useState<CardDrop | null>(null);
  const [activeCard, setActiveCard] = useState<CardDrop | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drawKey, setDrawKey] = useState(1);
  const [rollInProgress, setRollInProgress] = useState(false);

  // Initialize client mount & cache safely without hydration mismatch
  useEffect(() => {
    setMounted(true);
    const cached = getInitialCache();
    if (cached) {
      setWinningCard(cached.activeCard);
      setActiveCard(cached.activeCard);
      setRemainingSeconds(cached.remainingSeconds);
      setCanScratch(cached.canScratch);
      setIsScratched(cached.isScratched);
      setStatusLoaded(true);
    }
  }, []);

  const fetchCardStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/rewards/card", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();

      if (data.ok) {
        setStatusLoaded(true);
        const canDoScratch = Boolean(data.canScratch);
        const remSecs = Number(data.remainingSeconds || 0);

        setCanScratch(canDoScratch);
        setRemainingSeconds(remSecs);

        if (data.activeCard) {
          setActiveCard(data.activeCard);
          // If in cooldown, show the card that was already drawn
          if (!canDoScratch) {
            setWinningCard(data.activeCard);
            setIsScratched(true);
            try {
              const cooldownUntil = new Date(Date.now() + remSecs * 1000).toISOString();
              localStorage.setItem(
                "larpsense_scratch_cache",
                JSON.stringify({
                  activeCard: data.activeCard,
                  cooldownUntil,
                })
              );
            } catch {}
          } else {
            try {
              localStorage.removeItem("larpsense_scratch_cache");
            } catch {}
          }
        } else if (canDoScratch) {
          try {
            localStorage.removeItem("larpsense_scratch_cache");
          } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to load scratch card status:", err);
      setStatusLoaded(true);
    }
  }, []);

  // Authentication check & initial load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
      if (session) {
        fetchCardStatus(session.access_token);
      } else {
        setStatusLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        fetchCardStatus(session.access_token);
      } else {
        setCanScratch(false);
        setRemainingSeconds(0);
        setActiveCard(null);
        setWinningCard(null);
        setIsScratched(false);
        setStatusLoaded(true);
        try {
          localStorage.removeItem("larpsense_scratch_cache");
        } catch {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCardStatus]);

  // Real-time countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanScratch(true);
          setIsScratched(false);
          setWinningCard(null);
          setDrawKey((k) => k + 1);
          try {
            localStorage.removeItem("larpsense_scratch_cache");
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Server-authoritative roll triggered the moment user touches/scratches the card
  const handleStartScratch = async () => {
    if (!user) {
      window.dispatchEvent(new Event("open-auth"));
      return;
    }

    if (!canScratch || rollInProgress || !statusLoaded) return;

    setRollInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.dispatchEvent(new Event("open-auth"));
        setRollInProgress(false);
        return;
      }

      const res = await fetch("/api/rewards/card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setWinningCard(data.drop);
        setActiveCard(data.drop);
        // Do NOT set canScratch false here! Allow the user to finish scratching the card!
        const cooldown = Number(data.cooldownSeconds || 24 * 60 * 60);
        setRemainingSeconds(cooldown);
        try {
          const cooldownUntil = new Date(Date.now() + cooldown * 1000).toISOString();
          localStorage.setItem(
            "larpsense_scratch_cache",
            JSON.stringify({
              activeCard: data.drop,
              cooldownUntil,
            })
          );
        } catch {}
      } else {
        // Cooldown active or already drawn
        if (data.activeCard) {
          setWinningCard(data.activeCard);
          setActiveCard(data.activeCard);
        }
        if (data.remainingSeconds) {
          setRemainingSeconds(data.remainingSeconds);
        }
        setCanScratch(false);
        setIsScratched(true);
      }
    } catch (err) {
      console.error("Error drawing scratch card:", err);
    } finally {
      setRollInProgress(false);
    }
  };

  const handleScratchComplete = () => {
    setIsScratched(true);
    setCanScratch(false);
    const drop = activeCard || winningCard;
    playCardWinSound(Boolean(drop && drop.discountPct > 0));
  };

  const handleCopyCode = (codeToCopy?: string) => {
    const code = codeToCopy || activeCard?.code || winningCard?.code;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLocked = !user || !canScratch;

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      {/* Main Scratch Card Container */}
      <div className="flex flex-col items-center mb-8">
        <div
          onClick={() => {
            if (!user) {
              window.dispatchEvent(new Event("open-auth"));
            }
          }}
          className={`relative w-[315px] h-[466px] mb-6 select-none rounded-[22px] transition-all duration-500 ${
            !user ? "cursor-pointer group" : ""
          }`}
          style={{
            filter: mounted && winningCard && winningCard.discountPct > 0 && isScratched
              ? `drop-shadow(0 0 30px ${winningCard.textColor}45) drop-shadow(0 20px 40px rgba(0,0,0,0.85))`
              : HALLOWEEN_EVENT_ENABLED
              ? `drop-shadow(0 0 22px rgba(249, 115, 22, 0.3)) drop-shadow(0 20px 40px rgba(0,0,0,0.85))`
              : `drop-shadow(0 20px 40px rgba(0,0,0,0.85))`
          }}
        >
          {/* If not logged in, show lock badge overlay */}
          {mounted && !user && authChecked && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] rounded-[22px] flex flex-col items-center justify-center p-6 text-center transition-all group-hover:bg-black/50">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">
                Log In to Scratch
              </h4>
              <p className="text-xs text-[#a3a3a3] mb-4">
                Open your free daily card to win up to 20% discount
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new Event("open-auth"));
                }}
                className="px-6 py-2.5 bg-accent text-[#0a0a0a] font-black uppercase text-xs tracking-wider rounded-sm hover:opacity-90 transition-opacity"
              >
                Log In
              </button>
            </div>
          )}

          {/* If already scratched, show revealed card directly */}
          {mounted && winningCard && isScratched ? (
            <div className="relative w-full h-full rounded-[22px] overflow-hidden animate-in fade-in duration-500">
              <Image
                src={winningCard.image}
                fill
                alt={winningCard.name}
                className="object-contain pointer-events-none"
                sizes="315px"
                priority
              />
            </div>
          ) : mounted && statusLoaded ? (
            <ScratchCardCanvas
              width={315}
              height={466}
              isLocked={!user || (!canScratch && isScratched)}
              onStartScratch={handleStartScratch}
              onComplete={handleScratchComplete}
              revealedImage={winningCard?.image}
              drawKey={drawKey}
            />
          ) : (
            /* Loading shimmer during status check so foil is NEVER prematurely shown */
            <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-transparent flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full border-2 border-white/10 border-t-accent animate-spin mb-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Loading...</span>
            </div>
          )}

        </div>

        {/* Scratch Status Text */}
        <div className="text-[#737373] font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-2 mb-3">
          {!mounted || !statusLoaded ? (
            <span className="text-white/40">Loading status...</span>
          ) : !user ? (
            <span className="text-white/60">Log in to claim your daily card</span>
          ) : canScratch ? (
            <span>Scratch to reveal</span>
          ) : (
            <span className="text-[#888888]">Card claimed</span>
          )}

          {HALLOWEEN_EVENT_ENABLED && (
            <span className="text-orange-400 font-semibold tracking-normal flex items-center gap-1">
              &middot; Trick or Treat <MiniPumpkin className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Celebration header if discount won */}
        {mounted && activeCard && activeCard.discountPct > 0 && activeCard.status !== "used" && (!canScratch || isScratched) && (
          <div className="flex items-center gap-2 mb-2 animate-in fade-in zoom-in-95 duration-500">
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: activeCard.textColor }}>
              🎉 You won {activeCard.name}!
            </span>
          </div>
        )}

        {/* Promo Code Box Below Card */}
        {mounted && activeCard && activeCard.discountPct > 0 && activeCard.status !== "used" && activeCard.code && (!canScratch || isScratched) && (
          <div className="flex flex-col items-center gap-1.5 mb-2">
            <div 
              onClick={() => handleCopyCode(activeCard.code!)}
              title="Click to copy code"
              className="flex items-center gap-3 bg-[#0a0a0a] hover:bg-[#121212] border border-[#262626] hover:border-[#404040] rounded-xl px-4 py-2.5 transition-all cursor-pointer group shadow-xl active:scale-[0.98]"
            >
              <code className="text-xs font-mono font-bold tracking-widest text-[#f5f5f7] select-all">
                {activeCard.code}
              </code>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyCode(activeCard.code!);
                }}
                className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? "bg-accent text-[#0a0a0a]"
                    : "bg-[#1a1a1a] group-hover:bg-accent group-hover:text-[#0a0a0a] text-[#d4d4d4]"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <span className="text-[11px] text-[#737373] font-medium tracking-wide">
              Use this promo code at checkout to get <span className="text-accent font-bold">{activeCard.discountPct}% off</span>
            </span>
          </div>
        )}
      </div>

      {/* Action / Countdown Banner */}
      <div className="flex flex-col items-center mb-16 min-h-[50px] justify-center relative z-10">
        {!mounted || !statusLoaded ? (
          <div className="flex items-center gap-2.5 bg-[#0a0a0a]/70 backdrop-blur-md border border-white/10 text-[#737373] font-mono text-xs uppercase tracking-[0.2em] px-6 py-2.5 rounded-full select-none">
            <div className="w-3 h-3 rounded-full border border-white/20 border-t-accent animate-spin" />
            <span>Checking status...</span>
          </div>
        ) : !user ? (
          <button
            onClick={() => window.dispatchEvent(new Event("open-auth"))}
            className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] hover:border-white/30 text-white font-bold text-xs uppercase tracking-[0.2em] px-8 py-3 rounded-sm transition-all"
          >
            <Lock className="w-4 h-4 text-accent" /> Log In to Scratch Card
          </button>
        ) : !canScratch || remainingSeconds > 0 ? (
          <div className="flex items-center gap-2.5 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 text-[#a3a3a3] font-mono font-bold text-xs uppercase tracking-[0.25em] px-6 py-2.5 rounded-full select-none shadow-lg">
            <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>NEXT DROP IN <span className="text-white font-black">{formatTimer(remainingSeconds)}</span></span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center select-none">
            <span className="text-accent font-black text-sm uppercase tracking-[0.25em]">
              Free Daily Card Available
            </span>
            <span className="text-xs text-[#888888] font-semibold tracking-wider">
              Hold mouse button or finger and drag across the card to scratch
            </span>
          </div>
        )}
      </div>

      {/* Possible Rewards Table */}
      <div className="w-full max-w-4xl px-4">
        <h3 className="text-[#f5f5f7] font-black uppercase tracking-[0.2em] text-sm mb-6 flex items-center gap-3 border-b border-[#262626] pb-4">
          Possible Rewards
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {POSSIBLE_REWARDS.map((drop) => (
            <div
              key={drop.id}
              className="flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5"
            >
              {/* Floating Collectible Card */}
              <div
                className="relative w-full aspect-[900/1331] rounded-[18px] transition-all duration-300 group-hover:scale-[1.04]"
                style={{
                  filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.75))",
                }}
              >
                <Image
                  src={drop.image}
                  fill
                  alt={drop.name}
                  className="object-contain pointer-events-none"
                  sizes="(max-width: 768px) 50vw, 20vw"
                  priority
                />
              </div>

              {/* Card Title & Discount Info */}
              <div className="mt-3.5 flex flex-col items-center text-center">
                <span
                  className="font-black text-xs uppercase tracking-wider transition-colors"
                  style={{ color: drop.textColor }}
                >
                  {drop.name}
                </span>
                <span className="text-[10px] text-[#737373] uppercase tracking-widest font-mono mt-0.5">
                  {drop.discountPct > 0 ? `${drop.discountPct}% DISCOUNT` : "NO DISCOUNT"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
