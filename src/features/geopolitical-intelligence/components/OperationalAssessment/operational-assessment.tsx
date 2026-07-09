import { ShieldAlert } from "lucide-react";
import type { OperationalAssessment } from "../../types";

export function OperationalAssessment({
  assessment,
}: {
  assessment: OperationalAssessment;
}) {
  const getColors = (level: string) => {
    switch (level) {
      case "Critical":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "High":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "Medium":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
      case "Low":
        return "border-green-500/30 bg-green-500/10 text-green-400";
      default:
        return "border-white/10 bg-white/5 text-muted-foreground";
    }
  };

  const colors = getColors(assessment.threat_level);

  return (
    <div className={`glass-panel border-l-4 ${colors} px-5 py-4`}>
      <div className="flex items-center gap-3">
        <ShieldAlert aria-hidden className="size-5 shrink-0" />
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground/80">
            Current Operational Threat Level: {assessment.threat_level}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {assessment.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
