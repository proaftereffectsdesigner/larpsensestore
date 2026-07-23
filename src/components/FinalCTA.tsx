"use client";
import { useEffect, useState, useRef } from "react";

export default function FinalCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -100px 0px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className={`w-full max-w-7xl mx-auto py-32 md:py-48 px-4 flex flex-col items-center justify-center text-center border-t border-white/5 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
      <div className="flex flex-col items-center max-w-2xl">
        <p className="font-mono text-gray-600 text-xs md:text-sm mb-6 animate-pulse">
          {'>'} status: awaiting_token...
        </p>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-10 tracking-tight leading-tight">
          The client is ready. <br className="hidden md:block" />
          Select your tier.
        </h2>
        
        <button 
          onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-8 py-4 bg-transparent border border-emerald-500 text-emerald-500 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] focus:outline-none flex items-center justify-center gap-2 group"
        >
          Initialize Session
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </section>
  );
}
