import { Button, Tooltip, TooltipProvider } from "@cloudflare/kumo";
import { PRESET_PROMPTS } from "@/lib/constants";

type PresetPromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export function PresetPrompts({ onSelect, disabled = false }: PresetPromptsProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-kumo-subtle">
          Demo scenarios
        </span>
        <div className="no-scrollbar -mx-3 flex w-[calc(100%+1.5rem)] max-w-none gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:w-full sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {PRESET_PROMPTS.map((preset) => (
            <Tooltip
              key={preset.label}
              content={preset.description || preset.prompt}
              asChild
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelect(preset.prompt)}
                disabled={disabled}
                className="shrink-0 whitespace-nowrap active:scale-95 transition-transform"
              >
                {preset.label}
              </Button>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
