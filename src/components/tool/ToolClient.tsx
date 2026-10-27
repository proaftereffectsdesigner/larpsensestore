"use client";

import { useState, useEffect } from "react";
import { Download, ExternalLink, ArrowLeft, GitCommit, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ParticlesBackground from "@/components/ParticlesBackground";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

export default function ToolClient() {
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "r1k-k/LarpSense-NFA";

  useEffect(() => {
    async function fetchReleases() {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases`);
        if (!res.ok) throw new Error("Failed to fetch releases from GitHub.");
        const data = await res.json();
        if (data && data.length > 0) {
          setReleases(data);
        } else {
          setError("No releases found.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReleases();
  }, [repo]);

  const activeRelease = releases[selectedIndex];
  const downloadUrl = activeRelease?.assets?.find((a: any) => a.name.endsWith(".exe"))?.browser_download_url || activeRelease?.html_url;

  return (
    <>
      
      <div className="min-h-screen pt-24 pb-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1a1a1a] text-[#f5f5f7] transition-colors group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-center p-1.5 shadow-none">
                  <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <span>LarpSense NFA Tool</span>
                {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-6 h-6 -mt-1" />}
              </h1>
            </div>

            {!loading && !error && releases.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between gap-3 min-w-[200px] bg-[#141414] border border-[#262626] hover:bg-[#1a1a1a] text-white font-mono text-sm px-4 py-2.5 rounded-xl transition-colors shadow-none"
                >
                  <span className="truncate">
                    {releases[selectedIndex].tag_name} {selectedIndex === 0 ? <span className="text-accent ml-1 text-xs tracking-widest">(LATEST)</span> : ""}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-[220px] bg-[#0a0a0a] border border-[#262626] rounded-2xl overflow-hidden shadow-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {releases.map((rel, idx) => (
                          <button
                            key={rel.id}
                            onClick={() => {
                              setSelectedIndex(idx);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-sm font-mono transition-colors ${
                              selectedIndex === idx 
                                ? 'bg-[#0a0a0a] text-accent font-bold border border-[#262626]' 
                                : 'text-gray-400 hover:bg-[#141414] text-[#f5f5f7] border border-transparent'
                            }`}
                          >
                            <span>{rel.tag_name}</span>
                            {idx === 0 && <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded-md bg-[#141414] text-accent font-sans font-bold">LATEST</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar / Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-none">
                <h3 className="text-lg font-bold text-white mb-4">Download</h3>
                {loading ? (
                  <div className="animate-pulse flex flex-col gap-3">
                    <div className="h-12 bg-[#262626] rounded-xl"></div>
                    <div className="h-4 w-1/2 bg-[#262626] rounded mx-auto"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 text-sm font-semibold">{error}</div>
                ) : activeRelease ? (
                  <div className="space-y-4">
                    <a 
                      href={downloadUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-accent hover:bg-accent/80 text-black uppercase tracking-widest text-xs px-4 py-4 rounded-xl font-bold transition-colors shadow-none flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" /> Download .exe
                    </a>
                    
                    <div className="bg-black/30 rounded-xl p-4 space-y-3 mt-4 border border-[#262626]">
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Version:</span>
                        <span className="font-mono text-accent bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#262626]">{activeRelease.tag_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Date:</span>
                        <span className="font-mono text-gray-300">{new Date(activeRelease.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Status:</span>
                        <span className={`font-semibold ${selectedIndex === 0 ? "text-accent" : "text-amber-400"}`}>
                          {selectedIndex === 0 ? "Latest Release" : "Old Version"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-none">
                <h3 className="text-lg font-bold text-white mb-4">Repository</h3>
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  LarpSense NFA Tool is entirely open source. Feel free to inspect the code or compile it yourself.
                </p>
                <a 
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#262626] hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> View Source Code
                </a>
              </div>
            </div>

            {/* Main Content / Changelog */}
            <div className="lg:col-span-2">
              <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-none min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-[#262626] flex items-center justify-between gap-3 bg-[#0a0a0a] shrink-0">
                  <div className="flex items-center gap-3">
                    <GitCommit className="w-5 h-5 text-gray-400" />
                    <h2 className="text-xl font-bold text-white">Release Notes</h2>
                  </div>
                  {activeRelease && (
                    <span className="text-sm text-gray-500 font-mono hidden sm:block">{activeRelease.name}</span>
                  )}
                </div>
                
                <div className="p-6 md:p-8 flex-1">
                  {loading ? (
                    <div className="flex justify-center py-20">
                      <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-20 text-gray-500">
                      Could not load release notes.
                    </div>
                  ) : activeRelease && activeRelease.body ? (
                    <article className="prose prose-invert prose-emerald max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-accent hover:prose-a:text-[#f5f5f7] prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-white/10 prose-img:rounded-xl prose-li:my-1 text-gray-300 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeRelease.body}
                      </ReactMarkdown>
                    </article>
                  ) : (
                    <div className="text-center py-20 text-gray-500">
                      No release notes provided for this version.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
