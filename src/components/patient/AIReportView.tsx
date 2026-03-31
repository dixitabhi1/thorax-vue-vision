import { AIReport } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AIReportViewProps {
  data?: AIReport;
  canEdit: boolean;
}

export function AIReportView({ data, canEdit }: AIReportViewProps) {
  const { toast } = useToast();

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">AI analysis has not been generated yet.</p>
          {canEdit && (
            <Button onClick={() => toast({ title: "Processing", description: "AI analysis triggered (simulated)." })}>
              <Upload className="mr-2 h-4 w-4" />
              Trigger AI Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const riskColor = data.riskScore <= 3 ? "text-success" : data.riskScore <= 6 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-4">
      {/* Classification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-lg">AI Analysis Report</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              Generated: {new Date(data.generatedAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Classification</p>
            <p className="text-lg font-heading font-bold text-foreground mt-1">{data.classification}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Emphysema", value: `${data.emphysemaPercentage}%`, progress: data.emphysemaPercentage },
          { label: "Air Trapping", value: `${data.airTrappingPercentage}%`, progress: data.airTrappingPercentage },
          { label: "Lung Volume", value: `${data.lungVolume} L`, progress: null },
          { label: "Mean Density", value: `${data.meanLungDensity} HU`, progress: null },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-xl font-heading font-bold text-foreground mt-1">{metric.value}</p>
              {metric.progress !== null && (
                <Progress value={metric.progress} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Risk Score</p>
              <p className={`text-3xl font-heading font-bold ${riskColor}`}>{data.riskScore}/10</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nodules Detected</p>
              <p className="text-3xl font-heading font-bold text-foreground">{data.noduleCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segmentation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Lobe-wise Emphysema Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.segmentationResults).map(([lobe, percentage]) => (
              <div key={lobe} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{lobe}</span>
                  <span className="text-muted-foreground font-mono">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => toast({ title: "Re-processing", description: "AI analysis re-triggered (simulated)." })}
          >
            <Upload className="mr-2 h-4 w-4" />
            Re-run AI Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
