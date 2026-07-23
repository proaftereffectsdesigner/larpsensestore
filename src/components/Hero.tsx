"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Zap, RefreshCw, ChevronDown, FileKey2 } from "lucide-react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const [badgePhase, setBadgePhase] = useState<'typing' | 'done'>('typing');
  const [badgeText, setBadgeText] = useState('');
  
  const [injectorState, setInjectorState] = useState<'idle' | 'parsing' | 'loaded' | 'launching'>('idle');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDraggingToken, setIsDraggingToken] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    // Prevent browser scroll memory without aggressively pulling the user back to top if they already scrolled
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Trigger mount animation
    setMounted(true);

    const fullText = "> ping larpsense.store...";
    let currentIndex = 0;
    
    if (badgePhase === 'typing') {
      const interval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setBadgeText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setBadgePhase('done'), 800);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [badgePhase]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'nfa-token');
    e.dataTransfer.effectAllowed = 'move';
    // Hide original element after browser takes a snapshot for the drag ghost
    setTimeout(() => setIsDraggingToken(true), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDraggingToken(false);
    dragCounter.current = 0;
    setIsDraggingOver(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    setIsDraggingToken(false);
    const data = e.dataTransfer.getData('text/plain');
    if (data === 'nfa-token') {
      setInjectorState('parsing');
      setTimeout(() => setInjectorState('loaded'), 1500);
    }
  };

  return (
    <div className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 z-10 max-w-7xl mx-auto px-4 overflow-hidden">
      
      {/* Top Section: Two Columns */}
      <div className="flex flex-col lg:flex-row items-center gap-12 mb-20 lg:mb-24">
        
        {/* Left Column: Text & CTA */}
        <div className="w-full lg:w-[55%] flex flex-col items-start text-left relative z-20">
          
          {/* Animated Badge */}
          <div className={`mb-6 h-10 flex items-center bg-[#0a0a0a] border border-white/10 px-5 rounded-full font-mono text-xs text-gray-400 overflow-hidden shadow-sm transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {badgePhase === 'typing' ? (
              <span>{badgeText}<span className="animate-pulse">_</span></span>
            ) : (
              <span className="flex items-center gap-2 text-gray-300">
                <span className="text-emerald-500 font-bold">[✓]</span> Ping: 12ms <span className="text-white/20">|</span> Auto-Delivery: <span className="text-emerald-400">Active</span>
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 text-white leading-[1.1] text-balance transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Premium NFA Accounts. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              Secure & Instant
            </span> Access.
          </h1>

          {/* Sub-headline */}
          <p className={`text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Enterprise-grade NFA accounts paired with a proprietary token-based client. Experience secure, automated delivery and seamless authentication without compromising privacy.
          </p>

          {/* Action Button */}
          <div className={`w-full sm:w-auto transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button 
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 transition-all duration-300"
            >
              View Accounts <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Mockup */}
        <div className={`w-full lg:w-[45%] mt-12 lg:mt-0 relative flex justify-center lg:justify-end transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          
          {/* Draggable Token */}
          {injectorState === 'idle' && (
            <div className={`absolute -left-4 md:-left-12 top-20 md:top-32 z-30 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
              <div 
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 bg-[#111] border border-white/10 p-3 pr-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-colors ${isDraggingToken ? 'opacity-0' : 'opacity-100 animate-bounce'}`}
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <FileKey2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">nfa_accounts.txt</div>
                  <div className="text-[10px] text-gray-500">Drag into the tool</div>
                </div>
              </div>
            </div>
          )}

          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          {/* Mockup Container (Dropzone) */}
          <div 
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full max-w-xl aspect-[4/3] sm:aspect-[16/10] bg-[#0c0c0c]/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ring-1 ${
              isDraggingOver ? 'ring-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-[1.02]' : 'ring-white/10'
            }`}
          >
            {/* Title Bar */}
            <div className="h-8 border-b border-white/5 flex items-center px-3 justify-between bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Icon" className="w-3.5 h-3.5 object-contain drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]" />
                <div className="text-[10px] text-gray-400 font-sans tracking-wide">LarpSense NFA Tool</div>
              </div>
              <div className="flex gap-4 opacity-50">
                <div className="w-2.5 h-[1px] bg-white mt-1.5"></div>
                <div className="w-2.5 h-2.5 border border-white"></div>
                <div className="w-2.5 h-2.5 flex items-center justify-center text-white text-[10px]">✕</div>
              </div>
            </div>
            
            {/* Mockup Header Area */}
            <div className="p-4 md:p-5 border-b border-white/5">
              <div className="flex justify-between items-start mb-5">
                {/* Logo & Titles */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-emerald-500/10 bg-[#0a0a0a]">
                    <img src="/logo.png" alt="LarpSense Logo" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight tracking-tight">LarpSense NFA Tool</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium mt-0.5">Steam Non-Full-Access Manager</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="hidden sm:flex gap-6 text-center">
                  <div>
                    <div className="text-white font-black text-lg">0</div>
                    <div className="text-gray-500 text-[8px] uppercase tracking-widest font-bold">Accounts</div>
                  </div>
                  <div>
                    <div className="text-white font-black text-lg">0</div>
                    <div className="text-gray-500 text-[8px] uppercase tracking-widest font-bold">Prime</div>
                  </div>
                  <div>
                    <div className="text-white font-black text-lg">0</div>
                    <div className="text-gray-500 text-[8px] uppercase tracking-widest font-bold">On Cooldown</div>
                  </div>
                </div>
              </div>

              {/* Input Row */}
              <div className="flex gap-2">
                <div className="flex-1 bg-[#141414] border border-white/10 rounded-md px-3 flex items-center text-[11px] text-gray-500 font-mono overflow-hidden">
                  Paste your Steam JWT token or full account string...
                </div>
                <button className="hidden sm:flex px-3 py-1.5 border border-white/20 rounded-md text-white text-[11px] font-bold items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Verify
                </button>
                <button className="px-4 py-1.5 bg-[#5ced5c] text-black rounded-md text-[11px] font-bold hover:bg-[#4bcc4b] transition-colors">
                  Add
                </button>
              </div>
            </div>

            {/* Mockup Body (Terminal / Dropzone) */}
            <div className="flex-1 p-5 flex flex-col relative">
              {isDraggingOver && (
                <div className="absolute inset-0 z-10 bg-emerald-500/5 backdrop-blur-[2px] flex items-center justify-center border-2 border-emerald-500/50 border-dashed m-2 rounded-lg pointer-events-none">
                  <p className="text-emerald-400 font-bold bg-black/50 px-4 py-2 rounded-md">Drop file to parse accounts...</p>
                </div>
              )}
              
              {injectorState === 'idle' && (
                <div className="flex-1 flex items-center justify-center opacity-40 font-mono text-[11px] md:text-xs text-gray-400 pointer-events-none">
                  <p className="text-center">No profiles yet — paste a Steam JWT token<br/>or drag an account string file here.</p>
                </div>
              )}

              {injectorState === 'parsing' && (
                <div className="flex-1 flex flex-col space-y-2.5 pt-2 font-mono text-[11px] md:text-xs text-gray-400 pointer-events-none">
                  <p className="text-gray-300">{'>'} Parsing nfa_accounts.txt...</p>
                  <p className="text-emerald-400/80">{'>'} Validating accounts... <span className="text-emerald-400 font-bold">[OK]</span></p>
                  <p className="animate-pulse">_</p>
                </div>
              )}

              {(injectorState === 'loaded' || injectorState === 'launching') && (
                <div className="flex-1 flex flex-col">
                  <div className="bg-[#141414] border border-white/5 rounded-xl p-3 w-56 shadow-2xl relative">
                    {/* PRIME badge */}
                    <div className="absolute top-0 right-0 bg-[#ffb800] text-black text-[8px] font-extrabold px-2 py-0.5 rounded-bl-lg rounded-tr-xl flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      PRIME
                    </div>
                    
                    {/* Profile info */}
                    <div className="flex items-center gap-2.5 mb-3 mt-0.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover scale-110" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#5ced5c] border-[1.5px] border-[#141414] rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-xs leading-tight">LarpSense User</h3>
                        <p className="text-gray-500 text-[9px] font-mono mt-0.5">76561190000000000</p>
                        <p className="text-gray-400 text-[9px] flex items-center gap-1 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-[#5ced5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                          No cooldown
                        </p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-600 cursor-pointer hover:text-white transition-colors" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setInjectorState('launching');
                          setTimeout(() => {
                            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                            setTimeout(() => setInjectorState('idle'), 2000);
                          }, 1800);
                        }}
                        disabled={injectorState === 'launching'}
                        className="bg-[#5ced5c] text-black font-bold text-[10px] px-3 py-1.5 rounded-md flex-1 flex items-center justify-center gap-1.5 hover:bg-[#4bcc4b] hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(92,237,92,0.3)] transition-all duration-300 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        Log In
                      </button>
                      <button className="p-1 text-gray-500 hover:text-white transition-colors"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button className="p-1 text-gray-500 hover:text-white transition-colors"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></button>
                      <button className="p-1 text-gray-500 hover:text-white transition-colors"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>
                      <button className="p-1 text-red-500/70 hover:text-red-400 transition-colors"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                  </div>
                  
                  {/* Launching Status */}
                  <div className={`mt-6 text-left font-mono text-[11px] md:text-xs transition-all duration-500 ${injectorState === 'launching' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <p className="text-emerald-400 drop-shadow-[0_0_8px_rgba(92,237,92,0.8)] animate-pulse">
                      {'>'} Injecting token and launching Steam...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-20">
        
        {/* Box 1 */}
        <div className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex flex-col p-8 bg-[#141414]/80 border border-white/5 rounded-3xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:border-emerald-500/30 group h-full">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold mb-3 text-xl">Instant Auto-Delivery</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Credentials and secure tokens are dispatched to your email instantly after the payment clears.
            </p>
          </div>
        </div>

        {/* Box 2 */}
        <div className={`transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex flex-col p-8 bg-[#141414]/80 border border-white/5 rounded-3xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30 group h-full">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-bold mb-3 text-xl">Enterprise-Grade Security</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Our desktop client utilizes native Windows DPAPI encryption to secure your tokens locally. Your gaming sessions are airtight.
            </p>
          </div>
        </div>

        {/* Box 3 */}
        <div className={`transition-all duration-700 delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex flex-col p-8 bg-[#141414]/80 border border-white/5 rounded-3xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/30 group h-full">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
              <RefreshCw className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-bold mb-3 text-xl">Automated Warranty</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              If an account goes down, our system verifies it and issues a 1:1 replacement within your warranty window.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
