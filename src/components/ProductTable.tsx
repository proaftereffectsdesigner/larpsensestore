"use client";

import { products } from "@/lib/products";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductTable() {
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6 mt-12 relative z-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">Digital Accounts</h1>
        <p className="text-[#a1a1aa] max-w-2xl mx-auto">
          Instant delivery, verified accounts. Purchase securely and get access immediately via our dashboard.
        </p>
      </div>

      <div className="bg-[#141414]/90 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="py-4 px-6 font-medium text-sm text-[#a1a1aa] w-1/2">Product</th>
              <th className="py-4 px-6 font-medium text-sm text-[#a1a1aa] text-center">Status</th>
              <th className="py-4 px-6 font-medium text-sm text-[#a1a1aa] text-right">Price</th>
              <th className="py-4 px-6 font-medium text-sm text-[#a1a1aa] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => {
              const available = stockData ? stockData[product.type]?.available || 0 : null;
              
              return (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5 px-6">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-accent mb-1">Counter Strike 2</div>
                    <div className="font-semibold text-white text-base">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Instant Delivery</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {stockData === null ? (
                      <span className="inline-flex items-center gap-1.5 bg-white/5 text-gray-400 px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">
                        Checking...
                      </span>
                    ) : available > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full text-xs font-medium border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock ({available})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/20">
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-mono text-[15px] font-medium text-white">
                      €{product.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/product/${product.id}`}>
                      <button
                        className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
