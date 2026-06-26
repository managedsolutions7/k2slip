"use client";

import { useState, useRef, useEffect } from "react";

interface ComboBoxProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export default function ComboBox({
  label,
  options,
  value,
  onChange,
  required,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes((filter || value).toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={filter || value}
        onChange={(e) => {
          setFilter(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required={required}
        className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={`Select or type ${label.toLowerCase()}`}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border bg-white shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setFilter("");
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-blue-50"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
