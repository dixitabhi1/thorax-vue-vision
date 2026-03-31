import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "in-progress" | "processing" | "complete";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/20",
    "in-progress": "bg-info/15 text-info border-info/20",
    processing: "bg-info/15 text-info border-info/20 animate-pulse-subtle",
    complete: "bg-success/15 text-success border-success/20",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    processing: "Processing",
    complete: "Complete",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", styles[status])}>
      {labels[status]}
    </Badge>
  );
}
