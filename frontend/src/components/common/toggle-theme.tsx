import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/theme.hook";
import { MoonIcon, SunIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function ToggleTheme() {
  const { setTheme, theme } = useTheme();

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer rounded-sm shadow-none h-8"
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="rotate-90 scale-0 transition-transform duration-500 ease-in-out dark:rotate-0 dark:scale-100" />
            <MoonIcon className="scale-100 absolute  rotate-0 transition-transform duration-500 ease-in-out dark:-rotate-90 dark:scale-0" />
            <span className="sr-only">Trocar Tema</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Trocar Tema</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
