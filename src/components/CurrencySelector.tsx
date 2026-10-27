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
        className="flex items-center gap-1.5 h-8 px-2 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-white group"
      >
        <span className="text-sm font-medium transition-colors">{current.code}</span>
        <span className="text-xs transition-colors">{current.symbol}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : "group-hover:text-white"}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-56 bg-[#111] border border-white/10 rounded-[16px] shadow-2xl animate-in fade-in zoom-in-95 origin-top-right z-50 overflow-hidden">
          
          {/* Seamless Search Bar */}
          <div className="flex items-center px-3 py-2 border-b border-white/5 bg-[#111]">
            <svg className="w-4 h-4 text-white/40 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[13px] text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto overscroll-contain custom-scrollbar p-1.5">
            {filteredCurrencies.length === 0 ? (
              <div className="text-[13px] text-white/40 text-center py-6">No results</div>
            ) : (
              filteredCurrencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-colors ${
                    currency === c.code 
                      ? "bg-white/10 text-white" 
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium w-8 text-left">{c.code}</span>
                    <span className="text-[13px] text-white/40 font-normal">{c.label}</span>
                  </div>
                  {currency === c.code && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
