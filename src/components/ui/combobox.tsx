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
  const [value, setValue] = useState(defaultValue || "");
  const listId = `list-${name}`;

  return (
    <>
      <Input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        list={listId}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
