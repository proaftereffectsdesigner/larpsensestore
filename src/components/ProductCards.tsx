"use client";

import { products } from "@/lib/products";
import { CheckCircle2, ChevronRight, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

import ParticlesBackground from "@/components/ParticlesBackground";
import Image from "next/image";
import { useCurrency } from "@/lib/CurrencyContext";

export default function ProductCards() {
  const [stockData, setStockData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { convert, currency } = useCurrency();

  useEffect(() => {
    // Intersection Observer to trigger animation when scrolled into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock && data.stock.cs2) {
          setStockData(data.stock.cs2);
        } else {
          setStockData({});
        }
      })
      .catch((err) => {
        console.error(err);
        setStockData({});
      });
  }, []);

  const getDescription = (id: string) => {
    switch(id) {
      case "prime": return "Standard Prime NFA accounts for matchmaking. No bans, instantly delivered.";
      case "premier": return "Standard NFA accounts ready for Premier mode. Blank slate for your journey.";
      case "premier-4-medals": return "Premier NFA accounts loaded with 4+ service medals. Show off your veteran status.";
      case "premier-10-medals": return "Premier NFA accounts loaded with 10+ service medals. Show off your veteran status.";
      case "premier-10k": return "Jump straight into high Elo with 10.000 CS Rating.";
      case "premier-15k": return "Jump straight into high Elo with 15.000 CS Rating.";
      case "premier-20k": return "Jump straight into high Elo with 20.000 CS Rating.";
      case "premier-rare": return "The ultimate flex. NFA Accounts loaded with a knife or gloves.";
      default: return "Premium NFA account instantly delivered.";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 relative z-10" id="products" ref={containerRef}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-full mx-auto">
        {products.map((product, index) => {
          const totalStock = stockData ? (stockData[product.type]?.available || 0) : 0;
          const img = product.id === "prime" ? "/prime-bg.png" : "/premier-bg.jpg";
          const desc = getDescription(product.id);

          return (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className={`transition-all duration-1000 ease-out block ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${index % 3 === 1 ? 'delay-200' : index % 3 === 2 ? 'delay-300' : 'delay-100'}`}
            >
              <div className="group bg-[#1a1a1a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-white/10 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                {/* Obrazek (Graphic Placeholder) */}
                <div className="w-full aspect-square relative flex flex-col items-center justify-center overflow-hidden">
                  <Image 
                    src={img} 
                    alt={product.name} 
                    fill 
                    className="object-cover transition-transform duration-700 scale-[1.15] group-hover:scale-[1.20]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent z-10 pointer-events-none" />
                  
                  {/* Tagi na górze */}
                  <div className="absolute top-6 left-6 z-20">
                    <span className="inline-flex items-center bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest backdrop-blur-md border border-white/10 uppercase">
                      Counter Strike 2
                    </span>
                  </div>

                  <div className="absolute top-6 right-6 z-20">
                    {stockData === null ? (
                      <span className="inline-flex items-center gap-1.5 bg-black/40 text-gray-400 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border border-white/10 animate-pulse">
                        Checking...
                      </span>
                    ) : totalStock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border border-red-500/20">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Dolna sekcja z opisem */}
                <div className="px-6 pb-6 pt-2 md:px-8 md:pb-8 flex flex-col flex-1 bg-[#1a1a1a] relative z-20">
                  <h2 className="text-2xl font-bold text-white group-hover:text-white transition-colors">{product.name}</h2>
                  <p className="text-sm text-gray-400 mt-2 mb-6 line-clamp-2">
                    {desc}
                  </p>
                  
                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">Price</div>
                      <div className="font-mono text-xl font-bold text-white tracking-tight">
                        {convert(product.price).formatted}
                      </div>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-full group-hover:bg-white/10 transition-colors text-white border border-white/5 group-hover:border-white/10">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
