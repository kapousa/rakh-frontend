import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../../lib/utils";

/** Shows a "▲ 12%" / "▼ 8%" badge, colored green if it's an improvement, red if not. */
export default function DeltaBadge({ delta, className }) {
  if (!delta) return null;
  const { pct_change, is_improvement } = delta;
  const Icon = pct_change >= 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        is_improvement ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
        className
      )}
    >
      <Icon size={11} />
      {Math.abs(pct_change)}%
    </span>
  );
}
