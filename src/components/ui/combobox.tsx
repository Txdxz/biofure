"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  name: string;
  defaultValue?: string;
  options: string[];
  placeholder?: string;
}

export default function Combobox({ name, defaultValue, options, placeholder }: Props) {
  const [mode, setMode] = useState<"existing" | "custom">(
    defaultValue && !options.includes(defaultValue) ? "custom" : "existing"
  );
  const [selectValue, setSelectValue] = useState(
    defaultValue && options.includes(defaultValue) ? defaultValue : "__choose__"
  );
  const [customValue, setCustomValue] = useState(
    defaultValue && !options.includes(defaultValue) ? defaultValue : ""
  );

  // Sync defaultValue on edit
  useEffect(() => {
    if (defaultValue) {
      if (options.includes(defaultValue)) {
        setMode("existing");
        setSelectValue(defaultValue);
      } else {
        setMode("custom");
        setCustomValue(defaultValue);
      }
    }
  }, [defaultValue, options]);

  const finalValue = mode === "custom" ? customValue : selectValue;

  return (
    <div className="flex gap-2 items-center">
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        value={mode === "existing" ? selectValue : "__custom__"}
        onChange={(e) => {
          if (e.target.value === "__custom__") {
            setMode("custom");
          } else {
            setMode("existing");
            setSelectValue(e.target.value);
          }
        }}
      >
        <option value="__choose__" disabled hidden>{placeholder || "选择"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value="__custom__">+ 自定义</option>
      </select>
      {mode === "custom" && (
        <Input
          name={name}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="输入自定义值"
          className="flex-1"
        />
      )}
      {mode === "existing" && (
        <input type="hidden" name={name} value={finalValue} />
      )}
    </div>
  );
}
