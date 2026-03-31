import { useState } from "react";
import { RadiologyReport } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit2 } from "lucide-react";

interface RadiologyReportViewProps {
  data?: RadiologyReport;
  canEdit: boolean;
  studyId: string;
}

export function RadiologyReportView({ data, canEdit, studyId }: RadiologyReportViewProps) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  const isEditing = canEdit && editing;

  const handleSave = () => {
    toast({ title: "Saved", description: "Radiology report updated." });
    setEditing(false);
  };

  if (!data && !canEdit) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No radiology report available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="font-heading text-lg">Radiology Report</CardTitle>
          {data?.reportedBy && (
            <p className="text-xs text-muted-foreground mt-1">
              Reported by {data.reportedBy} on {data.reportDate}
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => (editing ? handleSave() : setEditing(true))}
          >
            {editing ? <><Save className="mr-2 h-4 w-4" />Save</> : <><Edit2 className="mr-2 h-4 w-4" />Edit</>}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Findings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Findings</Label>
            {isEditing ? (
              <Textarea defaultValue={data?.findings} rows={4} placeholder="Describe CT findings..." />
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded leading-relaxed">{data?.findings || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Impression</Label>
            {isEditing ? (
              <Textarea defaultValue={data?.impression} rows={3} placeholder="Overall impression..." />
            ) : (
              <p className="text-sm text-foreground bg-muted p-3 rounded font-medium">{data?.impression || "—"}</p>
            )}
          </div>
        </div>

        {/* Specific Findings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Specific Findings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Emphysema Score", value: data?.emphysemaScore },
              { label: "Air Trapping", value: data?.airTrapping },
              { label: "Nodules", value: data?.nodules },
              { label: "Bronchiectasis", value: data?.bronchiectasis },
              { label: "Consolidation", value: data?.consolidation },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <Label className="text-xs">{field.label}</Label>
                {isEditing ? (
                  <Input defaultValue={field.value} />
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{field.value || "—"}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label className="text-xs">Pleural Effusion</Label>
              {isEditing ? <Switch defaultChecked={data?.pleuralEffusion} /> : (
                <span className="text-xs font-medium">{data?.pleuralEffusion ? "Present" : "Absent"}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label className="text-xs">Lymphadenopathy</Label>
              {isEditing ? <Switch defaultChecked={data?.lymphadenopathy} /> : (
                <span className="text-xs font-medium">{data?.lymphadenopathy ? "Present" : "Absent"}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
