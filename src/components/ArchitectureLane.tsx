"use client";

import { type NodeProps } from "@xyflow/react";
import type { ArchitectureLaneNode } from "@/lib/architecture";

export function ArchitectureLane({ data }: NodeProps<ArchitectureLaneNode>) {
  const isProtected = data.tone === "blue";

  return (
    <div
      className={`h-full w-full rounded-2xl border border-dashed p-3 ${
        isProtected
          ? "border-kumo-brand/30 bg-kumo-info-tint/30"
          : "border-kumo-line bg-kumo-recessed/30"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-kumo-subtle">
        {data.label}
      </p>
      {data.subtitle && (
        <p className="mt-1 text-xs font-medium text-kumo-strong">
          {data.subtitle}
        </p>
      )}
      {data.badges && data.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-kumo-base px-2 py-0.5 text-[10px] font-medium text-kumo-strong ring-1 ring-kumo-line"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
