"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  name: string;
  defaultValue?: string;
  options: string[];        // DB-derived options
  defaults?: string[];      // hardcoded default options (always shown)
  placeholder?: string;
}

export default function Combobox({ name, defaultValue, options, defaults, placeholder }: Props) {
  // Merge: defaults first (always), then DB options, dedup
  const allOptions = [...new Set([...(defaults || []), ...options])];

  const [mode, setMode] = useState<"choose" | "existing" | "custom">(
    defaultValue
      ? (defaults?.includes(defaultValue) || options.includes(defaultValue) ? "existing" : "custom")
      : "choose"
  );
  const [selectValue, setSelectValue] = useState(defaultValue && allOptions.includes(defaultValue) ? defaultValue : "");
  const [customValue, setCustomValue] = useState(
    defaultValue && !allOptions.includes(defaultValue) ? defaultValue : ""
  );

  // Sync defaultValue changes (edit mode)
  useEffect(() => {
    if (defaultValue) {
      if (allOptions.includes(defaultValue)) {
        setMode("existing");
        setSelectValue(defaultValue);
      } else {
        setMode("custom");
        setCustomValue(defaultValue);
      }
    }
  }, [defaultValue]);

  const finalValue = mode === "custom" ? customValue : selectValue;

  function handleSelectChange(v: string) {
    if (v === "__custom__") {
      setMode("custom");
      setCustomValue("");
    } else if (v === "") {
      setMode("choose");
    } else {
      setMode("existing");
      setSelectValue(v);
    }
  }

  return (
    <div className="flex gap-2 items-center w-full">
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm min-w-0 flex-1"
        value={mode === "custom" ? "__custom__" : mode === "choose" ? "" : selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
      >
        <option value="" disabled>{placeholder || "选择"}</option>
        {allOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value="__custom__">+ 自定义</option>
      </select>

      {mode === "custom" ? (
        <Input
          name={name}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="输入自定义值"
          className="flex-1"
          autoFocus
        />
      ) : (
        <input type="hidden" name={name} value={finalValue} />
      )}
    </div>
  );
}
