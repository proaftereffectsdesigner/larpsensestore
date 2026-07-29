"use client";
import { Users, Star, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function SocialProof() {
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
      { threshold: 0.2, rootMargin: '0px 0px -150px 0px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto py-16 px-4 border-t border-white/5">
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        
        <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-3xl font-black text-white mb-2">2,500+</h3>
          <p className="text-gray-400 font-medium">Orders Completed</p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className="text-3xl font-black text-white mb-2">4.9/5</h3>
          <p className="text-gray-400 font-medium">Average Rating</p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-white mb-2">100%</h3>
          <p className="text-gray-400 font-medium">Delivery Rate</p>
        </div>

      </div>

      <div className={`mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="p-6 bg-[#0f0f0f] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-500"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
            <span className="text-gray-500 text-xs font-bold">2 days ago</span>
          </div>
          <p className="text-gray-300 italic mb-4">"Instant delivery and the account was exactly as described. The custom launcher is actually insane, bypasses everything perfectly. Definitely buying again."</p>
          <div className="text-sm font-bold text-gray-500">— Alex M.</div>
        </div>
        <div className="p-6 bg-[#0f0f0f] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-500"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
            <span className="text-gray-500 text-xs font-bold">1 week ago</span>
          </div>
          <p className="text-gray-300 italic mb-4">"Was skeptical because of the lack of refunds, but the 6-hour warranty is legit. First token had an issue, support replaced it in 5 minutes. Top tier service."</p>
          <div className="text-sm font-bold text-gray-500">— Jordan K.</div>
        </div>
      </div>
    </section>
  );
}
