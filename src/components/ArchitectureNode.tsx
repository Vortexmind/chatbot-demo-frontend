"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ArrowsLeftRight,
  Browser,
  Browsers,
  ChartLine,
  Cloud,
  Database,
  Lightning,
  LockKey,
  Path,
  Robot,
  ShieldCheck,
  type Icon,
} from "@phosphor-icons/react";
import type {
  ArchitectureFlowNode,
  ArchitectureIcon,
  ArchitectureTone,
} from "@/lib/architecture";

const ICONS: Record<ArchitectureIcon, Icon> = {
  browser: Browser,
  frontend: Browsers,
  access: LockKey,
  waf: ShieldCheck,
  worker: Cloud,
  agent: Robot,
  durable: Database,
  gateway: ArrowsLeftRight,
  guardrails: ShieldCheck,
  router: Path,
  "workers-ai": Lightning,
  observability: ChartLine,
};

const TONES: Record<
  ArchitectureTone,
  { icon: string; ring: string; badge: string }
> = {
  neutral: {
    icon: "bg-kumo-recessed text-kumo-strong",
    ring: "ring-kumo-line",
    badge: "bg-kumo-recessed text-kumo-strong",
  },
  blue: {
    icon: "bg-kumo-info-tint text-kumo-link",
    ring: "ring-kumo-brand/40",
    badge: "bg-kumo-info-tint text-kumo-link",
  },
  violet: {
    icon: "bg-kumo-recessed text-kumo-brand",
    ring: "ring-kumo-brand/40",
    badge: "bg-kumo-recessed text-kumo-brand",
  },
  orange: {
    icon: "bg-kumo-warning-tint text-kumo-warning",
    ring: "ring-kumo-warning/40",
    badge: "bg-kumo-warning-tint text-kumo-warning",
  },
  green: {
    icon: "bg-kumo-success-tint text-kumo-success",
    ring: "ring-kumo-success/40",
    badge: "bg-kumo-success-tint text-kumo-success",
  },
};

export function ArchitectureNode({
  data,
  selected,
}: NodeProps<ArchitectureFlowNode>) {
  const tone = TONES[data.tone];
  const IconComponent = ICONS[data.icon];

  return (
    <div
      className={`w-[170px] rounded-xl border border-kumo-line bg-kumo-base px-2.5 py-2.5 shadow-sm transition-all duration-300 sm:w-[200px] lg:w-[220px] lg:px-3 lg:py-3 ${
        data.active ? `scale-[1.02] ring-2 ${tone.ring}` : ""
      } ${selected ? "ring-2 ring-kumo-line" : ""} ${
        data.dimmed ? "opacity-40" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!h-2 !w-2 !border-0 !bg-kumo-line"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!h-1.5 !w-1.5 !border-0 !bg-kumo-line !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!h-1.5 !w-1.5 !border-0 !bg-kumo-line !opacity-0"
      />
      <div className="flex items-start gap-2">
        <div className={`rounded-lg p-1.5 ${tone.icon}`}>
          <IconComponent weight="duotone" className="h-4 w-4 lg:h-5 lg:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-kumo-default lg:text-sm">
            {data.title}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-kumo-strong lg:text-[11px]">
            {data.subtitle}
          </p>
        </div>
      </div>
      {data.badges && data.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tone.badge}`}
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!h-2 !w-2 !border-0 !bg-kumo-line"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!h-1.5 !w-1.5 !border-0 !bg-kumo-line !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!h-1.5 !w-1.5 !border-0 !bg-kumo-line !opacity-0"
      />
    </div>
  );
}
