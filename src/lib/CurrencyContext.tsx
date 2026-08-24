"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
  convert: (amountInEur: number) => { amount: number; symbol: string; formatted: string };
  convertFromLocal: (amountInLocal: number) => number;
  isSuffix: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>({ EUR: 1 });

  useEffect(() => {
    const saved = localStorage.getItem("preferred_currency");
    if (saved) {
      setCurrencyState(saved);
    } else {
      // First visit: Auto-detect currency based on IP
      fetch("https://get.geojs.io/v1/ip/country.json")
        .then(res => res.json())
        .then(data => {
          const country = data.country;
          const countryToCurrency: Record<string, string> = {
            PL: "PLN", US: "USD", GB: "GBP", CH: "CHF", SE: "SEK",
            NO: "NOK", DK: "DKK", CA: "CAD", AU: "AUD", JP: "JPY",
            CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", TR: "TRY",
            IL: "ILS", BR: "BRL", MX: "MXN", IN: "INR", NZ: "NZD", ZA: "ZAR"
          };
          const autoCurrency = countryToCurrency[country] || "EUR";
          setCurrencyState(autoCurrency);
          localStorage.setItem("preferred_currency", autoCurrency);
        })
        .catch(err => {
          console.error("Failed to detect location, defaulting to EUR", err);
          setCurrencyState("EUR");
          localStorage.setItem("preferred_currency", "EUR");
        });
    }

    fetch("/api/rates")
      .then(res => res.json())
      .then(data => setRates(data))
      .catch(err => console.error("Failed to load rates", err));
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem("preferred_currency", c);
  };

  const convert = (amountInEur: number) => {
    const rate = rates[currency] || 1;
    const amount = amountInEur * rate;
    const symbols: Record<string, string> = { 
      EUR: "€", PLN: "zł", USD: "$", GBP: "£", CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr",
      CAD: "$", AUD: "$", JPY: "¥", CZK: "Kč", HUF: "Ft", RON: "lei", BGN: "лв",
      TRY: "₺", ILS: "₪", BRL: "R$", MXN: "$", INR: "₹", NZD: "$", ZAR: "R"
    };
    const suffixCurrencies = ["PLN", "SEK", "NOK", "DKK", "CHF", "CZK", "HUF", "RON", "BGN"];
    const sym = symbols[currency] || "€";
    const amountStr = amount.toFixed(2);
    const formatted = suffixCurrencies.includes(currency) ? `${amountStr} ${sym}` : `${sym}${amountStr}`;
    return { amount, symbol: sym, formatted };
  };

  const convertFromLocal = (amountInLocal: number) => {
    const rate = rates[currency] || 1;
    return amountInLocal / rate;
  };

  const suffixCurrencies = ["PLN", "SEK", "NOK", "DKK", "CHF", "CZK", "HUF", "RON", "BGN"];
  const isSuffix = suffixCurrencies.includes(currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, convertFromLocal, isSuffix }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
