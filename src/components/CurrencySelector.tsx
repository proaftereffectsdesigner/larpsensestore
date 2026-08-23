"use client";

import { useCurrency } from "@/lib/CurrencyContext";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const currencies = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "PLN", symbol: "zł", label: "Polish Złoty" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "SEK", symbol: "kr", label: "Swedish Krona" },
  { code: "NOK", symbol: "kr", label: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", label: "Danish Krone" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", label: "Hungarian Forint" },
  { code: "RON", symbol: "lei", label: "Romanian Leu" },
  { code: "BGN", symbol: "лв", label: "Bulgarian Lev" },
  { code: "TRY", symbol: "₺", label: "Turkish Lira" },
  { code: "ILS", symbol: "₪", label: "Israeli New Shekel" },
  { code: "CAD", symbol: "$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "$", label: "Australian Dollar" },
  { code: "NZD", symbol: "$", label: "New Zealand Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real" },
  { code: "MXN", symbol: "$", label: "Mexican Peso" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
];

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const current = currencies.find(c => c.code === currency) || currencies[0];

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-10 px-3 bg-[#141414]/80 hover:bg-[#1f1f1f]/80 backdrop-blur-md border border-white/10 rounded-full transition-colors"
      >
        <span className="text-sm font-bold text-white">{current.code}</span>
        <span className="text-xs text-gray-400">{current.symbol}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#141414] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50">
          <div className="px-2 pb-2 border-b border-white/10 mb-2">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              autoFocus
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 mb-1">
              Currency
            </div>
            {filteredCurrencies.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No results found</div>
            ) : (
              filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    currency === c.code 
                      ? "bg-accent/20 text-accent" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col items-start leading-tight">
                    <span>{c.code}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{c.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{c.symbol}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
