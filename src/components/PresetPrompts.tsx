import { Button, Tooltip, TooltipProvider } from "@cloudflare/kumo";
import { PRESET_PROMPTS } from "@/lib/constants";

type PresetPromptsProps = {
  onSelect: (prompt: string) => void;
  centered?: boolean;
};

export function PresetPrompts({ onSelect, centered = false }: PresetPromptsProps) {
  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}>
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
            >
              {preset.label}
            </Button>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
