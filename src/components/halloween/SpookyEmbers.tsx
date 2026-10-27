"use client";

import React, { useEffect, useRef } from "react";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export default function SpookyEmbers() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!HALLOWEEN_EVENT_ENABLED) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Color palette: Harvest Amber, Jack-o'-lantern Orange, Ghost Violet, Deep Blood Crimson
    const colors = [
      "249, 115, 22", // orange
      "234, 88, 12",  // amber
      "168, 85, 247", // purple
      "192, 132, 252", // light purple
      "251, 146, 60"  // light orange
    ];

    const emberCount = Math.min(35, Math.floor(width / 35));
    const embers: Ember[] = Array.from({ length: emberCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: -(Math.random() * 0.45 + 0.15),
      speedX: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.4,
      maxOpacity: Math.random() * 0.35 + 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulseSpeed: Math.random() * 0.03 + 0.015,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];

        e.y += e.speedY;
        e.x += e.speedX + Math.sin(e.pulsePhase) * 0.2;
        e.pulsePhase += e.pulseSpeed;

        // Wrap around bottom if floated above top
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        if (e.x < -10) e.x = width + 10;
        if (e.x > width + 10) e.x = -10;

        const currentOpacity =
          Math.max(0.05, Math.min(e.maxOpacity, Math.sin(e.pulsePhase) * e.maxOpacity));

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${e.color}, ${currentOpacity})`;
        ctx.shadowColor = `rgba(${e.color}, 0.8)`;
        ctx.shadowBlur = e.size * 3;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!HALLOWEEN_EVENT_ENABLED) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20 select-none overflow-hidden"
      style={{ opacity: 0.85 }}
      aria-hidden="true"
    />
  );
}
