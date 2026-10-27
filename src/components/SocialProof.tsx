"use client";
import { Users, Star, TrendingUp, UserIcon } from "lucide-react";
import Link from "next/link";
import { products } from "@/lib/products";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client";

export default function SocialProof() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ orders: 0, avgRating: 5.0, count: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
    
    // Fetch stats via public API to bypass RLS
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/public/store-stats');
        const data = await res.json();
        if (data && !data.error) {
          setStats(s => ({ ...s, orders: data.orders || 0, avgRating: data.avgRating || 5.0, count: data.reviewCount || 0 }));
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Failed to fetch store stats", err);
      }
    };
    
    fetchStats();
    
    return () => observer.disconnect();
  }, []);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating; // best first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest first
  });

  const nextSlide = () => {
    if (currentIndex + 4 < sortedReviews.length) {
      setCurrentIndex(currentIndex + 4);
    }
  };

  const prevSlide = () => {
    if (currentIndex - 4 >= 0) {
      setCurrentIndex(currentIndex - 4);
    }
  };

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto py-16 px-4 border-t border-white/5">
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        
        <div className="flex flex-col items-center justify-center p-8">
          <h3 className="text-[64px] leading-none font-bold text-white tracking-tighter mb-4">{stats.orders > 0 ? `${stats.orders}+` : '0'}</h3>
          <p className="text-[15px] text-[#f5f5f7]/60 font-medium">Orders Completed</p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 border-l border-r border-white/5 md:border-transparent">
          <h3 className="text-[64px] leading-none font-bold text-white tracking-tighter mb-4">{stats.count > 0 ? `${stats.avgRating}/5` : '5.0/5'}</h3>
          <p className="text-[15px] text-[#f5f5f7]/60 font-medium">Average Rating</p>
        </div>

        <div className="flex flex-col items-center justify-center p-8">
          <h3 className="text-[64px] leading-none font-bold text-white tracking-tighter mb-4">100%</h3>
          <p className="text-[15px] text-[#f5f5f7]/60 font-medium">Delivery Rate</p>
        </div>

      </div>

      <div className={`mt-16 flex flex-col transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Reviews</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevSlide} 
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white bg-[#141414] hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={nextSlide} 
              disabled={currentIndex + 4 >= sortedReviews.length}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white bg-[#141414] hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedReviews.length > 0 ? (
            sortedReviews.slice(currentIndex, currentIndex + 4).map((review, i) => (
              <div key={i} className="p-8 bg-[#111111] rounded-[24px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`w-3.5 h-3.5 ${idx < review.rating ? 'text-[#47c92f] fill-[#47c92f]' : 'text-neutral-800'}`} />
                    ))}
                  </div>
                  <span className="text-[#f5f5f7]/40 text-xs font-medium ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                  <span className="text-[11px] ml-auto text-[#47c92f] font-semibold tracking-tight">Verified Purchase</span>
                </div>
                <p className="text-[#f5f5f7]/90 text-[15px] leading-relaxed mb-6">"{review.comment ? (review.comment.length > 150 ? review.comment.slice(0, 150) + '...' : review.comment) : 'Great service!'}"</p>
                
                <div className="flex items-center gap-3">
                  {review.profiles?.avatar_url ? (
                    <img src={review.profiles.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 shrink-0 rounded-full bg-[#47c92f]/10 flex items-center justify-center text-[#47c92f] font-semibold text-base">
                      {(review.profiles?.display_name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex flex-col flex-1 leading-tight">
                    <Link href={`/user/${review.profiles?.id}`} className="text-[14px] font-semibold text-white hover:underline transition-all">
                      {review.profiles?.display_name || 'Anonymous'}
                    </Link>
                    <span className="text-[12px] text-[#f5f5f7]/50 font-medium mt-0.5">Purchased {products.find(p => p.id === review.product_type)?.name || review.product_type}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-8">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No reviews yet. Be the first to leave one after your purchase!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
