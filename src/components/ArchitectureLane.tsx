"use client";

import { type NodeProps } from "@xyflow/react";
import type { ArchitectureLaneNode } from "@/lib/architecture";

export function ArchitectureLane({ data }: NodeProps<ArchitectureLaneNode>) {
  return (
    <div className="h-full w-full rounded-2xl border border-dashed border-kumo-line bg-kumo-recessed/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-kumo-subtle">
        {data.label}
      </p>
    </div>
  );
}
