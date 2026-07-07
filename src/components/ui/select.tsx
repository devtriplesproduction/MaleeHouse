"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Select({ value, onValueChange, placeholder, children, className, buttonClassName, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false);
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

  const selectedChild = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === value
  ) as React.ReactElement;

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-350 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-white/[0.08] transition-all duration-200 outline-none select-none",
            open && "ring-2 ring-indigo-500/20 border-indigo-400 dark:border-indigo-500",
            disabled && "opacity-50 cursor-not-allowed hover:bg-slate-50 hover:border-slate-200 dark:hover:bg-white/5 dark:hover:border-white/8",
            buttonClassName
          )}
        >
          <span className={cn(!value && "text-slate-400 dark:text-slate-500")}>
            {selectedChild ? selectedChild.props.children : placeholder}
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-300 flex-shrink-0 ml-2", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute top-full right-0 z-50 mt-1.5 min-w-[12rem] w-full max-w-[18rem] rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-100/40 dark:shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
            <div className="p-1 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-slate-250 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              {React.Children.count(children) > 0 ? (
                children
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectItem({ 
  value, 
  children, 
  className 
}: { 
  value: string; 
  children: React.ReactNode; 
  className?: string 
}) {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => {
        context?.onValueChange(value);
        context?.setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-4 text-xs font-semibold text-slate-600 dark:text-slate-300 outline-none transition-colors hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white",
        isSelected && "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-500/10",
        className
      )}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />}
      </span>
      {children}
    </button>
  );
}
