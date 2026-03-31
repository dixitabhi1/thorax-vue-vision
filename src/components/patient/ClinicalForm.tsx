import { useState } from "react";
import { ClinicalParameters } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit2 } from "lucide-react";

interface ClinicalFormProps {
  data?: ClinicalParameters;
  canEdit: boolean;
  studyId: string;
}

export function ClinicalForm({ data, canEdit, studyId }: ClinicalFormProps) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const isEditing = canEdit && editing;

  const handleSave = () => {
    toast({ title: "Saved", description: "Clinical parameters updated successfully." });
    setEditing(false);
  };

  if (!data && !canEdit) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No clinical data recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-heading text-lg">Clinical Parameters</CardTitle>
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
        {/* Presenting Complaints */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Presenting Complaints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chief Complaint</Label>
              {isEditing ? (
                <Textarea defaultValue={data?.chiefComplaint} placeholder="Describe chief complaint..." />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{data?.chiefComplaint || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Cough Duration</Label>
              {isEditing ? (
                <Input defaultValue={data?.coughDuration} placeholder="e.g., 6 months" />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{data?.coughDuration || "—"}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label className="text-xs">Sputum Production</Label>
              {isEditing ? <Switch defaultChecked={data?.sputumProduction} /> : (
                <span className="text-xs font-medium">{data?.sputumProduction ? "Yes" : "No"}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label className="text-xs">Hemoptysis</Label>
              {isEditing ? <Switch defaultChecked={data?.hemoptysis} /> : (
                <span className="text-xs font-medium">{data?.hemoptysis ? "Yes" : "No"}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label className="text-xs">Weight Loss</Label>
              {isEditing ? <Switch defaultChecked={data?.weightLoss} /> : (
                <span className="text-xs font-medium">{data?.weightLoss ? "Yes" : "No"}</span>
              )}
            </div>
            <div className="space-y-1 p-3 rounded bg-muted">
              <Label className="text-xs">Dyspnea Grade</Label>
              {isEditing ? (
                <Select defaultValue={data?.dyspneaGrade}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Grade 0", "Grade I", "Grade II", "Grade III", "Grade IV"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs font-medium">{data?.dyspneaGrade || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Smoking History */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Smoking History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Smoking Status</Label>
              {isEditing ? (
                <Select defaultValue={data?.smokingHistory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Never smoker">Never smoker</SelectItem>
                    <SelectItem value="Former smoker">Former smoker</SelectItem>
                    <SelectItem value="Current smoker">Current smoker</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{data?.smokingHistory || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Pack Years</Label>
              {isEditing ? (
                <Input type="number" defaultValue={data?.packYears} min={0} />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{data?.packYears ?? "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pulmonary Function */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Pulmonary Function Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "FEV1 (L)", value: data?.fev1 },
              { label: "FVC (L)", value: data?.fvc },
              { label: "FEV1/FVC (%)", value: data?.fev1FvcRatio },
              { label: "SpO2 (%)", value: data?.spo2 },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <Label className="text-xs">{field.label}</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" defaultValue={field.value} />
                ) : (
                  <p className="text-sm font-medium text-foreground bg-muted p-2 rounded">{field.value ?? "—"}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Additional Notes</Label>
          {isEditing ? (
            <Textarea defaultValue={data?.notes} rows={3} placeholder="Clinical notes..." />
          ) : (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{data?.notes || "—"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
