import { useEffect, useRef, useState } from "react";
import type { DriverName } from "./DriverName";
import { Label } from "./Label";

const OPTIONS: { value: DriverName; label: string }[] = [
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
];

export function DriverCombobox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DriverName;
  onChange: (value: DriverName) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const commit = (v: DriverName) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (
      !open &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      setActiveIndex(OPTIONS.findIndex((o) => o.value === value));
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % OPTIONS.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + OPTIONS.length) % OPTIONS.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(OPTIONS[activeIndex].value);
    }
  };

  return (
    <div className="flex flex-row items-center gap-3">
      <Label text={label} />
      <div ref={rootRef} className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => {
            setActiveIndex(OPTIONS.findIndex((o) => o.value === value));
            setOpen((v) => !v);
          }}
          onKeyDown={onKeyDown}
          className="flex w-32 items-center justify-between rounded-[5px] border border-[#1f4a3c] bg-[#0b1f19] px-2 py-1.5 text-xs text-[#E6F2EC]"
        >
          <span>{selected.label}</span>
          <span className="ml-2 text-[#7fa99a]">▾</span>
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-32 overflow-hidden rounded-[5px] border border-[#1f4a3c] bg-[#0b1f19] py-1 shadow-lg"
          >
            {OPTIONS.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => commit(o.value)}
                className={`cursor-pointer px-2 py-1.5 text-xs text-[#E6F2EC] ${
                  i === activeIndex ? "bg-[#1f4a3c]" : ""
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
