"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface SearchSelectProps {
  options: { id: string; name?: string; fullName?: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  displayKey?: string;
  disabled?: boolean;
}

export function SearchSelect({ options, value, onChange, placeholder, displayKey = "name", disabled }: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  const filtered = options.filter(o => {
    const displayValue = o[displayKey as keyof typeof o] as string || o.fullName || o.name || "";
    return displayValue.includes(query);
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = selected?.[displayKey as keyof typeof selected] as string || selected?.fullName || selected?.name || "";

  return (
    <div ref={ref} className="relative">
      <Input
        value={open ? query : displayValue}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => { if (!disabled) { setQuery(""); setOpen(true); } }}
        placeholder={placeholder}
        className="w-full"
        disabled={disabled}
      />
      {open && !disabled && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">无匹配</div>}
          {filtered.map((o) => {
            const optionDisplay = o[displayKey as keyof typeof o] as string || o.fullName || o.name || "";
            return (
              <div
                key={o.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${o.id === value ? "bg-gray-50 font-medium" : ""}`}
                onMouseDown={() => { onChange(o.id); setOpen(false); setQuery(""); }}
              >
                {optionDisplay}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}