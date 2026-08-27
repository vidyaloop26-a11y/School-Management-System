import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { flatNav } from "@/lib/mockData";

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const pages = useMemo(() => flatNav(), []);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages…"
        value={q}
        onValueChange={setQ}
        data-testid="command-input"
      />
      <CommandList className="thin-scroll">
        <CommandEmpty>No results found — try a different search term.</CommandEmpty>

        <CommandGroup heading="Pages">
          {pages.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem
                key={p.key}
                value={`page ${p.label}`}
                data-testid={`command-page-${p.key}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate(p.path);
                }}
              >
                <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
                <span>{p.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
