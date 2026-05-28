"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    defaultValue && options.includes(defaultValue) ? defaultValue : (options[0] || "")
  );
  const [customValue, setCustomValue] = useState(
    defaultValue && !options.includes(defaultValue) ? defaultValue : ""
  );

  // Sync defaultValue changes (edit mode)
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

  const finalValue = mode === "existing" ? selectValue : customValue;

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={mode === "existing" ? selectValue : "__custom__"}
        onValueChange={(v) => {
          if (v === "__custom__") { setMode("custom"); }
          else { setMode("existing"); setSelectValue(v || ""); }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || "选择或输入"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
          <SelectItem value="__custom__">+ 自定义</SelectItem>
        </SelectContent>
      </Select>
      {mode === "custom" ? (
        <Input
          name={name}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="输入自定义值"
          className="flex-1"
        />
      ) : (
        <input type="hidden" name={name} value={finalValue} />
      )}
    </div>
  );
}
