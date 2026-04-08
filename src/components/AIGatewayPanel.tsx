import { Badge, Surface } from "@cloudflare/kumo";
import type { AIGatewayInfo } from "@/lib/types";

type AIGatewayPanelProps = {
  info: AIGatewayInfo;
  isError: boolean;
  isHighlighted: boolean;
};

export function AIGatewayPanel({ info, isError, isHighlighted }: AIGatewayPanelProps) {
  // Determine background color based on state
  let bgClass = "bg-kumo-recessed";
  let borderClass = "ring-kumo-line";
  let textClass = "text-kumo-default";
  let labelClass = "text-kumo-strong";

  if (isError) {
    bgClass = "bg-red-100";
    borderClass = "ring-red-500";
    textClass = "text-red-900";
    labelClass = "text-red-700";
  } else if (isHighlighted) {
    bgClass = "bg-yellow-100";
    borderClass = "ring-yellow-500";
  }

  return (
    <Surface
      className={`mb-4 p-3 rounded-md ring transition-colors duration-300 ${bgClass} ${borderClass}`}
    >
      <div className={`text-sm font-medium mb-2 ${textClass}`}>AI Gateway Info</div>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className={labelClass}>Model:</span>
          {info.model ? (
            <Badge variant="blue">{info.model}</Badge>
          ) : (
            <span className="text-kumo-subtle">N/A</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={labelClass}>Provider:</span>
          {info.provider ? (
            <Badge variant="neutral">{info.provider}</Badge>
          ) : (
            <span className="text-kumo-subtle">N/A</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={labelClass}>Debug:</span>
          <span className={info.debug ? textClass : "text-kumo-subtle"}>
            {info.debug || "N/A"}
          </span>
        </div>
      </div>
    </Surface>
  );
}
