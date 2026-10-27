"use client";

import { ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useCurrency } from "@/lib/CurrencyContext";
import MiniPumpkin from "./halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "./halloween/HalloweenConfig";

const CategoryCard = ({ category, inStock, convert }: any) => {
  return (
    <Link href={`/shop?category=${category.id}`} className="block h-full">
      <div className="relative group cursor-pointer h-full">
        {/* Card Body - Minimalist, sleek, grounded in row, zero clipping */}
        <div className="w-full h-full bg-[#111113] border border-white/10 group-hover:border-white/25 rounded-[28px] overflow-hidden relative z-10 flex flex-col items-center select-none transition-all duration-300 ease-out">
          
          {/* Badge: Stock - Exact Shop Style, no live dot */}
          <div className="absolute top-5 left-5 z-20">
            {inStock ? (
              <span className="bg-[#111] border border-white/5 text-emerald-500 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest">
                In Stock
              </span>
            ) : (
              <span className="bg-[#111] border border-white/5 text-red-500 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest">
                Out of Stock
              </span>
            )}
          </div>

          {/* Graphic Image */}
          <div className="w-full aspect-[16/9] relative mt-6 px-6 flex justify-center items-center">
            <div className="w-full h-full relative">
              <Image 
                src={category.image} 
                alt={category.name} 
                fill 
                className="object-contain transition-transform duration-500 ease-out group-hover:scale-105" 
              />
            </div>
          </div>

          {/* Details */}
          <div className="mt-auto w-full p-7 pt-4 flex flex-col items-center text-center">
            {/* Trust Badges */}
            <div className="flex gap-2 mb-3">
              <div className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded font-medium">
                <ShieldCheck className="w-3 h-3 text-[#48c931]" />
                <span>VERIFIED</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded font-medium">
                <Zap className="w-3 h-3 text-[#48c931]" />
                <span>INSTANT</span>
              </div>
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1.5 leading-tight">
              {category.name}
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 mb-6 font-normal line-clamp-2 max-w-xs">
              {category.desc}
            </p>
            
            <div className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm group-hover:bg-neutral-200 transition-colors duration-200 flex justify-center items-center gap-2">
              {category.originalPrice && (
                <span className="line-through text-neutral-400 text-xs font-normal">
                  {convert(category.originalPrice).formatted}
                </span>
              )}
              <span>Buy from {convert(category.price).formatted}</span>
              {HALLOWEEN_EVENT_ENABLED && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                  -15%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function ProductCards() {
  const [stockData, setStockData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { convert } = useCurrency();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock) setStockData(data.stock);
      })
      .catch(() => setStockData({}));
  }, []);

  const categories = [
    {
      id: "cs2",
      name: "CS2 Accounts",
      image: "/kategoria-cs2.webp",
      desc: "Prime status, Premier ready & ranked accounts delivered instantly.",
      price: 0.67,
      originalPrice: 0.79,
    },
    {
      id: "rust",
      name: "Rust Accounts",
      image: "/kategoria-rust.webp",
      desc: "Fresh NFA to high-hour wipe ready survivor accounts.",
      price: 1.54,
      originalPrice: 1.81,
    },
    {
      id: "extra",
      name: "Extra Accounts",
      image: "/kategoria-extra.webp",
      desc: "Tactical & survival accounts: Rainbow Six Siege, DayZ & Battlefield 6.",
      price: 1.19,
      originalPrice: 1.40,
    }
  ];

  const isCategoryInStock = (categoryId: string) => {
    if (!stockData) return true;
    if (categoryId === "cs2") {
      return (
        (stockData["cs2"]?.["prime"]?.available || 0) > 0 ||
        (stockData["cs2"]?.["premier"]?.available || 0) > 0
      );
    }
    if (categoryId === "rust") {
      return (
        (stockData["rust"]?.["1-99"]?.available || 0) > 0 ||
        (stockData["rust"]?.["100-199"]?.available || 0) > 0
      );
    }
    if (categoryId === "extra") {
      return (
        (stockData["extra"]?.["r6"]?.available || 0) > 0 ||
        (stockData["extra"]?.["dayz"]?.available || 0) > 0 ||
        (stockData["extra"]?.["bf6"]?.available || 0) > 0
      );
    }
    return true;
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-20 px-4 sm:px-8 relative z-10" ref={containerRef}>
      
      {/* Header with Title */}
      <div className={`mb-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight flex items-center gap-3">
          <span>Premium Selection.</span>
          {HALLOWEEN_EVENT_ENABLED && (
            <span className="inline-flex hover:rotate-12 transition-transform duration-300">
              <MiniPumpkin className="w-7 h-7 md:w-8 md:h-8" />
            </span>
          )}
        </h2>
        <p className="text-[#f5f5f7]/60 text-base md:text-lg mt-2.5 max-w-xl font-normal">
          Our highest quality accounts, hand-verified and ready for instant delivery. Take your pick.
        </p>
      </div>

      {/* 3 Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {categories.map((category, index) => {
          const inStock = isCategoryInStock(category.id);

          return (
            <div 
              key={category.id} 
              className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CategoryCard category={category} inStock={inStock} convert={convert} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
