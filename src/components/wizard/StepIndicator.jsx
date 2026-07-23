import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border-2 transition",
                  isDone && "bg-brand-600 border-brand-600 text-white",
                  isActive && "border-brand-600 text-brand-600 bg-brand-50",
                  !isDone && !isActive && "border-gray-200 text-gray-400"
                )}
              >
                {isDone ? <Check size={16} /> : stepNum}
              </div>
              <span className={cn("text-xs font-medium", isActive ? "text-brand-700" : "text-gray-400")}>
                {label}
              </span>
            </div>
            {stepNum !== steps.length && (
              <div className={cn("h-0.5 flex-1 mx-2", isDone ? "bg-brand-600" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
