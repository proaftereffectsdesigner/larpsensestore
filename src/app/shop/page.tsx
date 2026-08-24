"use client";

import { useState, useEffect, Suspense } from "react";
import { products, Product } from "@/lib/products";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";

const categories = [
  { id: "all", name: "All Products" },
  { id: "cs2", name: "Counter Strike 2" },
  { id: "rust", name: "Rust" },
  { id: "extra", name: "Extra" }
];

const sortOptions = [
  { id: "popular", name: "Most Popular" },
  { id: "price_asc", name: "Price: Low to High" },
  { id: "price_desc", name: "Price: High to Low" }
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const initialCategory = searchParams.get("category") || "all";
  const initialSortBy = searchParams.get("sort") || "popular";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [stockData, setStockData] = useState<any>(null);
  
  const { convert } = useCurrency();

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.stock) {
          setStockData(data.stock);
        } else {
          setStockData({});
        }
      })
      .catch((err) => {
        console.error(err);
        setStockData({});
      });
  }, []);

  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "all");
    setSortBy(searchParams.get("sort") || "popular");
  }, [searchParams]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "popular") return b.popularity - a.popularity;
    return 0;
  });

  const getGameName = (endpoint: string, id: string) => {
    if (endpoint === "rust") return "Rust";
    if (id === "r6") return "Rainbow Six Siege";
    if (id === "dayz") return "DayZ";
    if (id === "bf6") return "Battlefield 6";
    return "Counter Strike 2";
  };

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
        case "rust-1-99": return "Rust account with 1-100 hours played. Perfect for a fresh start.";
        case "rust-100-199": return "Rust account with 100-200 hours played. Build your base immediately.";
        case "rust-200-499": return "Rust account with 200-500 hours played. Experienced survivor account.";
        case "rust-500-999": return "Rust account with 500-1000 hours played. True veteran status.";
        case "rust-1000-plus": return "Rust account with 1000+ hours played. Absolute dominance.";
        case "r6": return "Rainbow Six Siege NFA account. Jump into tactical action.";
        case "dayz": return "DayZ NFA account. Survive the zombie apocalypse.";
        case "bf6": return "Battlefield 6 NFA account. Join the massive warfare.";
        default: return "Premium NFA account instantly delivered.";
      }
  };

  return (
    <div className="min-h-screen pt-8 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8">Store</h1>
        
        {/* Filters & Search */}
        <div className="w-full bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 mb-12 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center z-20">
          
          <div className="flex w-full md:w-1/3 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex w-full md:w-auto gap-4 flex-col sm:flex-row">
            <div className="relative">
              <select 
                value={activeCategory} 
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveCategory(val);
                  const params = new URLSearchParams(searchParams.toString());
                  if (val === "all") {
                    params.delete("category");
                  } else {
                    params.set("category", val);
                  }
                  router.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
                className="w-full sm:w-auto appearance-none bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm font-medium focus:outline-none focus:border-white/30 transition-all"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#141414]">{cat.name}</option>
                ))}
              </select>
              <SlidersHorizontal className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                value={sortBy} 
                onChange={(e) => {
                  const val = e.target.value;
                  setSortBy(val);
                  const params = new URLSearchParams(searchParams.toString());
                  if (val === "popular") {
                    params.delete("sort");
                  } else {
                    params.set("sort", val);
                  }
                  router.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
                className="w-full sm:w-auto appearance-none bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm font-medium focus:outline-none focus:border-white/30 transition-all"
              >
                {sortOptions.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-[#141414]">{opt.name}</option>
                ))}
              </select>
              <SlidersHorizontal className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="w-full flex flex-col gap-12">
          {categories.filter(c => c.id !== "all" && (activeCategory === "all" || activeCategory === c.id)).map(category => {
            const categoryProducts = filteredProducts.filter(p => p.category === category.id);
            
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category.id} className="w-full flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryProducts.map((product) => {
                    const totalStock = stockData ? (stockData[product.endpoint]?.[product.type]?.available || 0) : 0;
                    const img = product.id === "prime" ? "/prime-bg.png" : "/premier-bg.jpg";
                    const desc = getDescription(product.id);
                    const gameTag = getGameName(product.endpoint, product.id);

                    return (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.id}`}
                        className="group bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-white/10 hover:-translate-y-1 flex flex-col h-full cursor-pointer"
                      >
                        <div className="w-full aspect-video relative flex flex-col items-center justify-center overflow-hidden">
                          <Image 
                            src={img} 
                            alt={product.name} 
                            fill 
                            className="object-cover transition-transform duration-700 scale-[1.15] group-hover:scale-[1.20]" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent z-10 pointer-events-none" />
                          
                          <div className="absolute top-4 left-4 z-20">
                            <span className="inline-flex items-center bg-black/40 text-white px-2 py-1 rounded-md text-[9px] font-bold tracking-widest backdrop-blur-md border border-white/10 uppercase">
                              {gameTag}
                            </span>
                          </div>

                          <div className="absolute top-4 right-4 z-20">
                            {stockData === null ? (
                              <span className="inline-flex items-center gap-1.5 bg-black/40 text-gray-400 px-2 py-1 rounded-md text-[9px] font-bold backdrop-blur-md border border-white/10 uppercase animate-pulse">
                                Checking
                              </span>
                            ) : totalStock > 0 ? (
                              <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-[9px] font-bold backdrop-blur-md border border-green-500/20 uppercase">
                                <CheckCircle2 className="w-3 h-3" />
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2 py-1 rounded-md text-[9px] font-bold backdrop-blur-md border border-red-500/20 uppercase">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 flex flex-col flex-1 bg-[#1a1a1a] relative z-20">
                          <h2 className="text-xl font-bold text-white group-hover:text-white transition-colors truncate">{product.name}</h2>
                          <p className="text-xs text-gray-400 mt-2 mb-4 line-clamp-2 leading-relaxed">
                            {desc}
                          </p>
                          
                          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-0.5">Price</div>
                              <div className="font-mono text-lg font-bold text-white tracking-tight">
                                {convert(product.price).formatted}
                              </div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors text-white border border-white/5 group-hover:border-white/10">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center text-gray-500 font-medium">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-gray-500">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
