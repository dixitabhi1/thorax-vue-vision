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

// Helper components for read-only vs editable fields
function TextField({ label, value, editing, onChange, rows }: {
  label: string; value?: string; editing: boolean; onChange?: (v: string) => void; rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {editing ? (
        rows ? (
          <Textarea value={value || ""} onChange={(e) => onChange?.(e.target.value)} rows={rows} />
        ) : (
          <Input value={value || ""} onChange={(e) => onChange?.(e.target.value)} />
        )
      ) : (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{value || "—"}</p>
      )}
    </div>
  );
}

function NumericField({ label, value, editing, onChange, step, unit }: {
  label: string; value?: number | null; editing: boolean; onChange?: (v: number | null) => void; step?: string; unit?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}{unit ? ` (${unit})` : ""}</Label>
      {editing ? (
        <Input
          type="number"
          step={step || "0.01"}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value ? parseFloat(e.target.value) : null)}
        />
      ) : (
        <p className="text-sm font-medium text-foreground bg-muted p-2 rounded">{value ?? "—"}</p>
      )}
    </div>
  );
}

function BooleanField({ label, value, editing, onChange }: {
  label: string; value?: boolean; editing: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded bg-muted">
      <Label className="text-xs">{label}</Label>
      {editing ? (
        <Switch checked={value || false} onCheckedChange={onChange} />
      ) : (
        <span className="text-xs font-medium">{value ? "Yes" : "No"}</span>
      )}
    </div>
  );
}

export function ClinicalForm({ data, canEdit, studyId }: ClinicalFormProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ClinicalParameters>>(data || {});
  const { toast } = useToast();
  const isEditing = canEdit && editing;

  const update = <K extends keyof ClinicalParameters>(key: K, value: ClinicalParameters[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
            <TextField label="Cough" value={form.cough} editing={isEditing} onChange={(v) => update("cough", v)} />
            <div className="space-y-2">
              <Label className="text-xs">Dyspnea Grade</Label>
              {isEditing ? (
                <Select value={form.dyspneaGrade || ""} onValueChange={(v) => update("dyspneaGrade", v)}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {["Grade 0", "Grade I", "Grade II", "Grade III", "Grade IV"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{form.dyspneaGrade || "—"}</p>
              )}
            </div>
            <TextField label="Expectoration" value={form.expectoration} editing={isEditing} onChange={(v) => update("expectoration", v)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <BooleanField label="Hemoptysis" value={form.hemoptysis} editing={isEditing} onChange={(v) => update("hemoptysis", v)} />
            <BooleanField label="Chest Tightness" value={form.chestTightness} editing={isEditing} onChange={(v) => update("chestTightness", v)} />
          </div>
        </div>

        {/* Comorbidities */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Comorbidities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <BooleanField label="T2DM" value={form.t2dm} editing={isEditing} onChange={(v) => update("t2dm", v)} />
            <BooleanField label="HTN" value={form.htn} editing={isEditing} onChange={(v) => update("htn", v)} />
            <BooleanField label="CAD" value={form.cad} editing={isEditing} onChange={(v) => update("cad", v)} />
            <BooleanField label="TB" value={form.tb} editing={isEditing} onChange={(v) => update("tb", v)} />
            <BooleanField label="COVID" value={form.covid} editing={isEditing} onChange={(v) => update("covid", v)} />
            <BooleanField label="Childhood Pneumonia" value={form.childhoodPneumonia} editing={isEditing} onChange={(v) => update("childhoodPneumonia", v)} />
          </div>
        </div>

        {/* Smoking & Exposure */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Smoking & Exposure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Smoking</Label>
              {isEditing ? (
                <Select value={form.smoking || ""} onValueChange={(v) => update("smoking", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Never smoker">Never smoker</SelectItem>
                    <SelectItem value="Former smoker">Former smoker</SelectItem>
                    <SelectItem value="Current smoker">Current smoker</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{form.smoking || "—"}</p>
              )}
            </div>
            <TextField label="Exposure" value={form.exposure} editing={isEditing} onChange={(v) => update("exposure", v)} rows={2} />
          </div>
        </div>

        {/* Lab Investigations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Lab Investigations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumericField label="Hb" value={form.hb} editing={isEditing} onChange={(v) => update("hb", v)} unit="g/dL" />
            <NumericField label="TLC" value={form.tlc} editing={isEditing} onChange={(v) => update("tlc", v)} step="1" unit="/µL" />
            <NumericField label="DLC — N" value={form.dlcN} editing={isEditing} onChange={(v) => update("dlcN", v)} step="1" unit="%" />
            <NumericField label="DLC — L" value={form.dlcL} editing={isEditing} onChange={(v) => update("dlcL", v)} step="1" unit="%" />
            <NumericField label="DLC — E" value={form.dlcE} editing={isEditing} onChange={(v) => update("dlcE", v)} step="1" unit="%" />
            <NumericField label="Total IgE" value={form.totalIgE} editing={isEditing} onChange={(v) => update("totalIgE", v)} step="1" unit="IU/mL" />
            <NumericField label="HbA1c" value={form.hba1c} editing={isEditing} onChange={(v) => update("hba1c", v)} unit="%" />
          </div>
        </div>

        {/* Cardiopulmonary */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Cardiopulmonary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BooleanField label="Pulm HTN" value={form.pulmHTN} editing={isEditing} onChange={(v) => update("pulmHTN", v)} />
            <NumericField label="FEV1" value={form.fev1} editing={isEditing} onChange={(v) => update("fev1", v)} unit="L" />
            <NumericField label="FVC" value={form.fvc} editing={isEditing} onChange={(v) => update("fvc", v)} unit="L" />
            <NumericField label="FEV1/FVC" value={form.fev1FvcRatio} editing={isEditing} onChange={(v) => update("fev1FvcRatio", v)} unit="%" />
          </div>
        </div>

        {/* CT Findings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">CT Findings (Clinical Correlation)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Emphysema" value={form.emphysema} editing={isEditing} onChange={(v) => update("emphysema", v)} />
            <TextField label="Bullae / Cyst" value={form.bullaeCyst} editing={isEditing} onChange={(v) => update("bullaeCyst", v)} />
            <TextField label="Nodules / GGO" value={form.nodulesGGO} editing={isEditing} onChange={(v) => update("nodulesGGO", v)} />
            <TextField label="Mediastinal LN" value={form.mediastinalLN} editing={isEditing} onChange={(v) => update("mediastinalLN", v)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <BooleanField label="Pleural Effusion" value={form.pleuralEffusion} editing={isEditing} onChange={(v) => update("pleuralEffusion", v)} />
            <BooleanField label="Pneumothorax" value={form.pneumothorax} editing={isEditing} onChange={(v) => update("pneumothorax", v)} />
          </div>
        </div>

        {/* Additional Investigations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Additional Investigations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="ECG" value={form.ecg} editing={isEditing} onChange={(v) => update("ecg", v)} />
            <TextField label="ANA" value={form.ana} editing={isEditing} onChange={(v) => update("ana", v)} />
            <TextField label="ENA" value={form.ena} editing={isEditing} onChange={(v) => update("ena", v)} />
            <TextField label="RA" value={form.ra} editing={isEditing} onChange={(v) => update("ra", v)} />
            <TextField label="MSA" value={form.msa} editing={isEditing} onChange={(v) => update("msa", v)} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumericField label="S. Calcium" value={form.sCalcium} editing={isEditing} onChange={(v) => update("sCalcium", v)} unit="mg/dL" />
            <NumericField label="S. ACE" value={form.sACE} editing={isEditing} onChange={(v) => update("sACE", v)} unit="U/L" />
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
