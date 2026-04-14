import { Button, Tooltip, TooltipProvider } from "@cloudflare/kumo";
import { PRESET_PROMPTS } from "@/lib/constants";

type PresetPromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export function PresetPrompts({ onSelect, disabled = false }: PresetPromptsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-kumo-strong">Demo scenarios:</span>
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
              className="active:scale-95 transition-transform"
            >
              {preset.label}
            </Button>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
