import React from "react";
import { Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function ExportButton({ label = "Export", className = "", testId = "export-btn" }) {
  const onClick = () => {
    toast("Export started — this may take a moment");
  };
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 hover:border-[#29ABE2] hover:text-[#0c6a99] transition text-slate-700 px-4 py-2.5 text-[13px] font-medium ${className}`}
    >
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}
