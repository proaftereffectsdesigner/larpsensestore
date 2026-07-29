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
    
    // Fetch stats
    const fetchStats = async () => {
      // Get completed orders count
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
        
      // Get reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, profiles!inner(display_name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (reviewsData) {
        setReviews(reviewsData);
        if (reviewsData.length > 0) {
          const avg = reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / reviewsData.length;
          setStats({
            orders: orderCount || 0,
            avgRating: Number(avg.toFixed(1)),
            count: reviewsData.length
          });
        } else {
          setStats(s => ({ ...s, orders: orderCount || 0 }));
        }
      }
    };
    
    fetchStats();
    
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="w-full max-w-7xl mx-auto py-16 px-4 border-t border-white/5">
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        
        <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-3xl font-black text-white mb-2">{stats.orders > 0 ? `${stats.orders}+` : '0'}</h3>
          <p className="text-gray-400 font-medium">Orders Completed</p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className="text-3xl font-black text-white mb-2">{stats.count > 0 ? `${stats.avgRating}/5` : '5.0/5'}</h3>
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
        {reviews.length > 0 ? (
          reviews.map((review, i) => (
            <div key={i} className="p-6 bg-[#0f0f0f] border border-white/5 rounded-2xl hover:border-white/10 transition-colors shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                  ))}
                </div>
                <span className="text-gray-500 text-xs font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                <span className="text-[10px] ml-auto bg-green-500/10 text-green-400 px-2 py-1 rounded font-bold uppercase tracking-widest">Verified Purchase</span>
              </div>
              <p className="text-gray-300 italic mb-4">"{review.comment || 'Great service!'}"</p>
              
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                {review.profiles?.avatar_url ? (
                  <img src={review.profiles.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
                ) : (
                  <div className="w-10 h-10 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-gray-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                
                <div className="flex flex-col flex-1 leading-tight">
                  <Link href={`/user/${review.profiles?.id}`} className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                    {review.profiles?.display_name || 'Anonymous'}
                  </Link>
                  <span className="text-xs text-gray-500 font-medium">Purchased: <span className="text-accent">{products.find(p => p.id === review.product_type)?.name || review.product_type}</span></span>
                </div>
                
                <Link href={`/user/${review.profiles?.id}`} className="text-[10px] text-accent/80 hover:text-accent font-bold uppercase tracking-wider py-1.5 px-3 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors border border-accent/20 hover:border-accent/40">
                  View Profile
                </Link>
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
    </section>
  );
}
