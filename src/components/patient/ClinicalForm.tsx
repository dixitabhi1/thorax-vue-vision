import { useEffect, useState } from "react";
import { Save, Edit2 } from "lucide-react";
import { PulmonaryFormValues } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClinicalFormProps {
  data: PulmonaryFormValues;
  canEdit: boolean;
  onSave: (payload: Partial<PulmonaryFormValues>) => Promise<unknown>;
  saving: boolean;
}

type FieldType = "text" | "textarea" | "select";

interface FieldConfig {
  key: keyof PulmonaryFormValues;
  label: string;
  type?: FieldType;
  rows?: number;
  options?: string[];
}

const YES_NO_OPTIONS = ["Yes", "No"];
const DYSPNEA_GRADES = ["Grade 0", "Grade I", "Grade II", "Grade III", "Grade IV"];

const FIELD_GROUPS: Array<{ title: string; fields: FieldConfig[] }> = [
  {
    title: "Presenting Complaints",
    fields: [
      { key: "cough", label: "Cough", type: "textarea", rows: 2 },
      { key: "dyspnea_grade", label: "Dyspnea Grade", type: "select", options: DYSPNEA_GRADES },
      { key: "expectoration", label: "Expectoration" },
      { key: "hemoptysis", label: "Hemoptysis", type: "select", options: YES_NO_OPTIONS },
      { key: "chest_tightness", label: "Chest Tightness", type: "select", options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Comorbidities",
    fields: [
      { key: "t2dm", label: "T2DM", type: "select", options: YES_NO_OPTIONS },
      { key: "htn", label: "HTN", type: "select", options: YES_NO_OPTIONS },
      { key: "cad", label: "CAD", type: "select", options: YES_NO_OPTIONS },
      { key: "tb", label: "TB", type: "select", options: YES_NO_OPTIONS },
      { key: "covid", label: "COVID", type: "select", options: YES_NO_OPTIONS },
      { key: "childhood_pneumonia", label: "Childhood Pneumonia", type: "select", options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Exposure and Lab Investigations",
    fields: [
      { key: "smoking_exposure", label: "Smoking / Exposure", type: "textarea", rows: 2 },
      { key: "hb", label: "Hb" },
      { key: "haemoglobin", label: "Haemoglobin" },
      { key: "tlc", label: "TLC" },
      { key: "dlc_n_l_e", label: "DLC N/L/E" },
      { key: "total_ige", label: "Total IgE" },
      { key: "hba1c", label: "HbA1c" },
    ],
  },
  {
    title: "Cardiopulmonary",
    fields: [
      { key: "pulmonary_hypertension", label: "Pulmonary Hypertension", type: "select", options: YES_NO_OPTIONS },
      { key: "fev1", label: "FEV1" },
      { key: "fvc", label: "FVC" },
      { key: "fev1_fvc", label: "FEV1 / FVC" },
    ],
  },
  {
    title: "CT Findings",
    fields: [
      { key: "emphysema", label: "Emphysema" },
      { key: "bullae_cyst", label: "Bullae / Cyst" },
      { key: "nodules_ggo", label: "Nodules / GGO" },
      { key: "mediastinal_ln", label: "Mediastinal LN" },
      { key: "pleural_effusion", label: "Pleural Effusion", type: "select", options: YES_NO_OPTIONS },
      { key: "pneumothorax", label: "Pneumothorax", type: "select", options: YES_NO_OPTIONS },
    ],
  },
  {
    title: "Additional Investigations",
    fields: [
      { key: "ecg", label: "ECG" },
      { key: "ana", label: "ANA" },
      { key: "ena", label: "ENA" },
      { key: "ra", label: "RA" },
      { key: "msa", label: "MSA" },
      { key: "s_calcium", label: "S. Calcium" },
      { key: "s_ace", label: "S. ACE" },
      { key: "remarks", label: "Remarks", type: "textarea", rows: 3 },
    ],
  },
];

function Field({
  field,
  value,
  editing,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{field.label}</Label>
      {editing ? (
        field.type === "select" ? (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "textarea" ? (
          <Textarea value={value} rows={field.rows ?? 2} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <Input value={value} onChange={(event) => onChange(event.target.value)} />
        )
      ) : (
        <p className="text-sm text-muted-foreground bg-muted p-2 rounded whitespace-pre-wrap min-h-10">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

export function ClinicalForm({ data, canEdit, onSave, saving }: ClinicalFormProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<PulmonaryFormValues>(data);

  useEffect(() => {
    setFormState(data);
  }, [data]);

  const isEditing = canEdit && editing;

  const handleSave = async () => {
    await onSave(formState);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="font-heading text-lg">Pulmonary Clinical Form</CardTitle>
          {(data.updatedAt || data.updatedBy) && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "recently"}
              {data.updatedBy ? ` by ${data.updatedBy}` : ""}
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
          >
            {editing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </>
            ) : (
              <>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">{group.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <Field
                  key={String(field.key)}
                  field={field}
                  value={formState[field.key] ?? ""}
                  editing={isEditing}
                  onChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
