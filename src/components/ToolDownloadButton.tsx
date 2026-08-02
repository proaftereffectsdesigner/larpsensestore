"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import Link from "next/link";

export default function ToolDownloadButton() {
  const [version, setVersion] = useState<string | null>(null);

  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "r1k-k/LarpSense-NFA";

  useEffect(() => {
    async function fetchRelease() {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (res.ok) {
          const data = await res.json();
          setVersion(data.tag_name);
        }
      } catch (err) {
        // Silently fail for the tiny tag
      }
    }
    fetchRelease();
  }, [repo]);

  return (
    <Link 
      href="/tool"
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 h-10 rounded-full text-sm font-bold transition-all shadow-lg group"
    >
      <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
      <span className="hidden sm:inline">Get NFA Tool</span>
      {version && (
        <span className="ml-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] uppercase tracking-widest font-mono">
          {version}
        </span>
      )}
    </Link>
  );
}
