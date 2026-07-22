"use client";

import { products } from "@/lib/products";
import { CheckCircle2, ChevronRight, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import ParticlesBackground from "@/components/ParticlesBackground";

export default function ProductCards() {
  const [stockData, setStockData] = useState<any>(null);

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

  const primeProducts = products.filter(p => p.id === "prime");
  const premierProducts = products.filter(p => p.id.startsWith("premier"));

  const cards = [
    {
      id: "prime", // Maps to /category/prime
      title: "Prime Ready",
      products: primeProducts,
      imagePlaceholder: "bg-gradient-to-br from-indigo-900/40 to-[#111]"
    },
    {
      id: "premier", // Maps to /category/premier
      title: "Premier Ready",
      products: premierProducts,
      imagePlaceholder: "bg-gradient-to-br from-emerald-900/40 to-[#111]"
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {cards.map((card) => {
          const minPrice = Math.min(...card.products.map(p => p.price));
          const maxPrice = Math.max(...card.products.map(p => p.price));
          const priceRange = minPrice === maxPrice ? `€${minPrice.toFixed(2)}` : `€${minPrice.toFixed(2)} - €${maxPrice.toFixed(2)}`;
          
          let totalStock = 0;
          if (stockData) {
            card.products.forEach(p => {
              totalStock += (stockData[p.type]?.available || 0);
            });
          }

          return (
            <Link key={card.id} href={`/category/${card.id}`}>
              <div className="group bg-[#141414]/90 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-white/20 hover:-translate-y-1 flex flex-col h-full cursor-pointer">
                {/* Obrazek (Graphic Placeholder) */}
                <div className={`w-full aspect-square relative flex flex-col items-center justify-center p-8 overflow-hidden ${card.imagePlaceholder}`}>
                  <div className="absolute inset-0 opacity-50"><ParticlesBackground /></div>
                  <Gamepad2 className="w-24 h-24 text-white/10 mb-4 group-hover:scale-110 transition-transform duration-500 relative z-10" />
                  <div className="absolute top-4 left-4 z-10">
                    <div className="text-[10px] uppercase tracking-wider font-bold bg-black/50 text-white px-3 py-1.5 rounded-full backdrop-blur-md">
                      Counter Strike 2
                    </div>
                  </div>
                  {/* Status */}
                  <div className="absolute top-4 right-4">
                    {stockData === null ? (
                      <span className="inline-flex items-center gap-1.5 bg-black/50 text-gray-400 px-3 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md animate-pulse">
                        Checking...
                      </span>
                    ) : totalStock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md border border-green-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock ({totalStock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-[10px] font-medium backdrop-blur-md border border-red-500/30">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Dolna sekcja z opisem */}
                <div className="p-6 flex flex-col flex-1 bg-[#1c1c1c]">
                  <h2 className="text-2xl font-bold text-white group-hover:text-white transition-colors">{card.title}</h2>
                  <p className="text-sm text-gray-400 mt-2 mb-6 line-clamp-2">
                    {card.id === "prime" 
                      ? "Standard Prime accounts for matchmaking. No bans, instantly delivered."
                      : "Accounts ready for Premier mode. Choose your exact rating or medals."}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Starting from</div>
                      <div className="font-mono text-xl font-medium text-white">{priceRange}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full group-hover:bg-white group-hover:text-black transition-colors text-white">
                      <ChevronRight className="w-5 h-5" />
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
