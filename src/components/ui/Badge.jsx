import { cn } from "../../lib/utils";

const VARIANTS = {
  critical: "badge-critical",
  warning: "badge-warning",
  success: "badge-success",
  info: "bg-brand-50 text-brand-700 border-brand-100",
};

export default function Badge({ variant = "info", children, className }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", VARIANTS[variant], className)}>{children}</span>;
}
