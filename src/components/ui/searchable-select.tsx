"use client";

import * as React from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export function SearchableSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select...", 
  searchPlaceholder = "Search...",
  className,
  buttonClassName,
  disabled = false
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(!open);
          if (!open) setSearch(""); // Reset search on open
        }}
        className={cn(
          "w-full flex items-center justify-between px-3 h-10 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200 outline-none select-none",
          buttonClassName,
          open && "ring-2 ring-indigo-500/20 border-indigo-400 dark:border-indigo-500",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400 dark:text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 flex-shrink-0 ml-2", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[16rem] rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-100/40 dark:shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto p-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-lg text-sm text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors",
                    value === opt.value ? "text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-500/10" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {value === opt.value && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
