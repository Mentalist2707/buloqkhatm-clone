"use client";

import { cn } from "@/lib/utils";

interface JuzDotsProps {
  juzList: {
    juzNumber: number;
    status: "AVAILABLE" | "RESERVED" | "COMPLETED";
  }[];
  className?: string;
}

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: "bg-gray-200 hover:bg-emerald-200",
  RESERVED:  "bg-orange-300",
  COMPLETED: "bg-emerald-500",
};

const STATUS_TOOLTIP: Record<string, string> = {
  AVAILABLE: "Bo'sh",
  RESERVED:  "Band",
  COMPLETED: "O'qildi",
};

export function JuzDots({ juzList, className }: JuzDotsProps) {
  // 30 ta slot — ba'zi poralar hali DBda bo'lmasligi mumkin, default AVAILABLE
  const slots = Array.from({ length: 30 }, (_, i) => {
    const found = juzList.find((j) => j.juzNumber === i + 1);
    return {
      number: i + 1,
      status: found?.status ?? "AVAILABLE",
    };
  });

  return (
    <div className={cn("flex flex-wrap gap-[3px]", className)}>
      {slots.map((slot) => (
        <div
          key={slot.number}
          title={`${slot.number}-pora: ${STATUS_TOOLTIP[slot.status]}`}
          className={cn(
            "h-[10px] w-[10px] rounded-sm transition-colors duration-150 cursor-default",
            STATUS_DOT[slot.status]
          )}
        />
      ))}
    </div>
  );
}

/* ─── Legend ─── */
export function JuzDotsLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-[10px] text-muted-foreground", className)}>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-gray-200 inline-block" />
        Bo'sh
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-orange-300 inline-block" />
        Band
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
        O'qildi
      </span>
    </div>
  );
}
