import { Banner, Badge } from "@cloudflare/kumo";
import { ShieldWarning, Timer } from "@phosphor-icons/react";
import type { BlockInfo } from "@/lib/types";
import { getBlockType, getBlockLabel } from "@/lib/utils";

type BlockedResponseCardProps = {
  blocked: BlockInfo;
};

export function BlockedResponseCard({ blocked }: BlockedResponseCardProps) {
  const blockType = getBlockType(blocked.httpStatus);
  const blockLabel = getBlockLabel(blocked.httpStatus);

  const isRateLimit = blockType === "rate-limit";
  const Icon = isRateLimit ? Timer : ShieldWarning;
  const variant = isRateLimit ? "alert" : "error";

  // Build description from error details
  let description = "AI Gateway evaluated this request and applied a configured guardrail.";
  if (blocked.code && blocked.message) {
    description = `Error ${blocked.code}: ${blocked.message}`;
  } else if (blocked.message) {
    description = blocked.message;
  }

  return (
    <div className="my-2">
      <Banner
        variant={variant}
        icon={<Icon weight="bold" className="h-5 w-5" />}
        title={blockLabel}
        description={
          <span className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <Badge variant={isRateLimit ? "orange" : "red"}>
                HTTP {blocked.httpStatus}
              </Badge>
              <span>{description}</span>
            </span>
          </span>
        }
      />
      <p className="text-xs text-kumo-subtle mt-1 ml-1">
        This response was blocked by AI Gateway based on configured policies.
      </p>
    </div>
  );
}
