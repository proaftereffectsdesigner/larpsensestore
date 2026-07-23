"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

export function DateRangePicker({
  date,
  setDate,
  isActive,
  onOpen,
  className
}: {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  isActive?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [localDate, setLocalDate] = useState<DateRange | undefined>(date);

  // local state initialized appropriately.

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) setLocalDate(date);
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
          isOpen || isActive ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"
        }`}
      >
        <CalendarIcon className="w-3 h-3" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white text-sm font-bold">Custom Range</h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .rdp-root {
              --rdp-accent-color: #10b981;
              --rdp-accent-background-color: rgba(16, 185, 129, 0.1);
              --rdp-day-height: 32px;
              --rdp-day-width: 32px;
              --rdp-today-color: #10b981;
              --rdp-range_middle-background-color: rgba(16, 185, 129, 0.1);
              --rdp-range_start-date-background-color: #10b981;
              --rdp-range_end-date-background-color: #10b981;
              --rdp-selected-border: none;
              margin: 0;
            }
            .rdp-month_caption { color: white; font-weight: bold; }
            .rdp-button_next, .rdp-button_previous { color: #a1a1aa; background: rgba(255,255,255,0.05); border-radius: 0.5rem; transition: all 0.2s; }
            .rdp-button_next:hover:not(:disabled), .rdp-button_previous:hover:not(:disabled) { color: white; background: rgba(255,255,255,0.1); }
            .rdp-weekday { color: #71717a; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; }
            .rdp-day_button { color: #e4e4e7; border-radius: 0.5rem; font-size: 0.875rem; transition: all 0.2s; }
            .rdp-day_button:hover:not(:disabled):not(.rdp-day_button_selected) { background-color: rgba(255,255,255,0.1); color: white; }
            .rdp-selected .rdp-day_button { background-color: var(--rdp-accent-color) !important; color: #111 !important; font-weight: bold; }
            .rdp-selected .rdp-day_button:hover { background-color: #059669 !important; }
            .rdp-range_middle .rdp-day_button { background-color: transparent !important; color: white !important; border-radius: 0; }
            .rdp-outside { color: #52525b; opacity: 0.5; }
            .rdp-range_start .rdp-day_button { border-top-right-radius: 0; border-bottom-right-radius: 0; }
            .rdp-range_end .rdp-day_button { border-top-left-radius: 0; border-bottom-left-radius: 0; }
          `}} />

          <DayPicker
            mode="range"
            selected={localDate}
            onSelect={setLocalDate}
            numberOfMonths={2}
            className="p-3"
            showOutsideDays
          />
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
             <button 
                type="button"
                onClick={() => { 
                  setLocalDate(undefined); 
                  setDate(undefined);
                  if (onOpen) onOpen();
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors"
             >
               Clear
             </button>
             <button 
                type="button"
                onClick={() => {
                  setDate(localDate);
                  if (onOpen) onOpen();
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-white text-black hover:bg-gray-200 rounded-lg transition-colors"
             >
               Apply Range
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
