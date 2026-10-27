"use client";

import { useState, useEffect, Suspense } from "react";
import { products, Product, getProductImage, getGameName } from "@/lib/products";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useCurrency } from "@/lib/CurrencyContext";
import MiniPumpkin from "@/components/halloween/MiniPumpkin";
import { HALLOWEEN_EVENT_ENABLED } from "@/components/halloween/HalloweenConfig";

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
  const [isSortOpen, setIsSortOpen] = useState(false);
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
        case "premier-inactive": return "Premier NFA accounts with 14+ days of complete inactivity. Maximum longevity & low recovery risk.";
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
    <div className="min-h-screen pt-12 pb-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto flex flex-col">
        
        {/* Filters & Search */}
        <div className="w-full flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-16 pb-4 border-b border-white/10 z-20">
          
          {/* Invisible Tabs (Apple Style) */}
          <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  const val = cat.id;
                  setActiveCategory(val);
                  const params = new URLSearchParams(searchParams.toString());
                  if (val === "all") {
                    params.delete("category");
                  } else {
                    params.set("category", val);
                  }
                  router.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
                className={`text-[13px] tracking-wide whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'text-white font-semibold' : 'text-gray-500 hover:text-white'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative flex items-center w-full md:w-auto">
              <Search className={`w-4 h-4 absolute left-0 ${HALLOWEEN_EVENT_ENABLED ? 'text-orange-400/60' : 'text-gray-500'}`} />
              <input 
                type="text" 
                placeholder={HALLOWEEN_EVENT_ENABLED ? "Search accounts or treats... 🎃" : "Search..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full md:w-36 focus:md:w-56 transition-all bg-transparent border-none py-1 pl-6 pr-0 text-white text-[13px] focus:outline-none focus:ring-0 ${HALLOWEEN_EVENT_ENABLED ? 'placeholder:text-orange-200/40' : 'placeholder:text-gray-600'}`}
              />
            </div>

            <div 
              className="relative flex items-center" 
              tabIndex={0} 
              onBlur={(e) => { 
                if (!e.currentTarget.contains(e.relatedTarget)) setIsSortOpen(false); 
              }}
            >
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-transparent border-none py-1 text-gray-500 text-[13px] font-medium focus:outline-none focus:ring-0 cursor-pointer hover:text-white transition-colors"
              >
                {sortOptions.find(o => o.id === sortBy)?.name || "Sort"}
                <SlidersHorizontal className="w-3 h-3 text-gray-500" />
              </button>
              
              {isSortOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black z-50">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                        const params = new URLSearchParams(searchParams.toString());
                        if (opt.id === "popular") {
                          params.delete("sort");
                        } else {
                          params.set("sort", opt.id);
                        }
                        router.push(`${pathname}?${params.toString()}`, { scroll: false });
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${sortBy === opt.id ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Product Grid */}
        <div className="w-full flex flex-col gap-16">
          {categories.filter(c => c.id !== "all" && (activeCategory === "all" || activeCategory === c.id)).map(category => {
            const categoryProducts = filteredProducts.filter(p => p.category === category.id);
            
            if (categoryProducts.length === 0) return null;

            // Determine top 3 most frequently bought / popular accounts in this category
            const top3CategoryProductIds = new Set(
              [...categoryProducts]
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 3)
                .map(p => p.id)
            );

            return (
              <div key={category.id} className="w-full flex flex-col gap-6">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{category.name}</span>
                    {HALLOWEEN_EVENT_ENABLED && <MiniPumpkin className="w-5 h-5 -mt-0.5" />}
                  </h2>
                  <div className={`h-px flex-1 ${HALLOWEEN_EVENT_ENABLED ? 'bg-gradient-to-r from-orange-500/25 via-purple-500/20 to-transparent' : 'bg-white/10'}`}></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryProducts.map((product) => {
                    const totalStock = stockData ? (stockData[product.endpoint]?.[product.type]?.available || 0) : 0;
                    const img = product.image || getProductImage(product.id, product.category);
                    const desc = getDescription(product.id);

                    return (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.id}`}
                        className={`group relative flex flex-col bg-[#0a0a0a] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                          HALLOWEEN_EVENT_ENABLED 
                            ? 'border border-white/5 hover:border-orange-500/40' 
                            : 'border border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Header Banner Image */}
                        <div className="w-full h-32 relative overflow-hidden bg-[#111]">
                          <Image 
                            src={img} 
                            alt={product.name} 
                            fill 
                            className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 scale-100 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                          
                          {/* Halloween Spooky Pick Badge for Top 3 Most Bought Items */}
                          {HALLOWEEN_EVENT_ENABLED && top3CategoryProductIds.has(product.id) && (
                            <div className="absolute top-3 left-3 z-20">
                              <span className="bg-[#111] border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                                🎃 Spooky Pick
                              </span>
                            </div>
                          )}

                          <div className="absolute top-3 right-3 z-20">
                            {stockData === null ? (
                              <span className="bg-[#111] border border-white/5 text-gray-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                                Checking
                              </span>
                            ) : totalStock > 0 ? (
                              <span className="bg-[#111] border border-white/5 text-emerald-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                                In Stock
                              </span>
                            ) : (
                              <span className="bg-[#111] border border-white/5 text-red-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 p-6 pt-2 relative z-10">
                          <h3 className="text-lg font-bold text-white mb-2 leading-tight">{product.name}</h3>
                          <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed mb-8">{desc}</p>
                          
                          <div className="mt-auto flex items-end justify-between">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Price</span>
                              <div className="flex items-baseline gap-2">
                                {product.originalPrice && (
                                  <span className="text-xs line-through text-gray-500">
                                    {convert(product.originalPrice).formatted}
                                  </span>
                                )}
                                <span className="text-xl font-bold text-white tracking-tight">{convert(product.price).formatted}</span>
                                {HALLOWEEN_EVENT_ENABLED && (
                                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                                    -15%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300">
                              <ChevronRight className="w-5 h-5" />
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
            <div className="py-20 text-center text-gray-500 text-[13px]">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopClient() {
  return <ShopContent />;
}
