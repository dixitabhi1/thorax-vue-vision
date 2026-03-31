import { useEffect, useState } from "react";
import { Clock, Edit2, Save, ShieldCheck } from "lucide-react";
import { RadiologyAuditEntry, RadiologyReportData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface RadiologyReportViewProps {
  data: RadiologyReportData | null;
  canEdit: boolean;
  radiologistName: string;
  showAudit?: boolean;
  auditLog: RadiologyAuditEntry[];
  onSave: (reportText: string) => Promise<unknown>;
  saving: boolean;
}

export function RadiologyReportView({
  data,
  canEdit,
  radiologistName,
  showAudit = false,
  auditLog,
  onSave,
  saving,
}: RadiologyReportViewProps) {
  const [editing, setEditing] = useState(false);
  const [reportText, setReportText] = useState(data?.radiologicalImpression || "");
  const isEditing = canEdit && editing;

  useEffect(() => {
    setReportText(data?.radiologicalImpression || "");
  }, [data]);

  const handleSave = async () => {
    await onSave(reportText);
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-lg">Radiology Report</CardTitle>
            {(data?.reportedBy || data?.reportDate) && (
              <p className="text-xs text-muted-foreground mt-1">
                {data?.reportedBy ? `Reported by ${data.reportedBy}` : "Reported"}
                {data?.reportDate ? ` on ${new Date(data.reportDate).toLocaleString()}` : ""}
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
          <div className="space-y-2">
            <Label>Report Text</Label>
            {isEditing ? (
              <Textarea
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                rows={10}
                placeholder="Enter the radiological impression..."
              />
            ) : (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded leading-relaxed whitespace-pre-wrap min-h-40">
                {data?.radiologicalImpression || "No radiology report has been saved yet."}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 p-3 rounded bg-primary/10 border border-primary/20 text-sm text-primary">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>
                The report will be auto-signed as <strong>{radiologistName || "the current radiologist"}</strong> and an audit log entry will be written before save.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {showAudit && auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="font-heading text-sm">Audit Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLog.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="flex items-start gap-3 text-xs p-2 rounded bg-muted">
                  <span className="text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="text-foreground font-medium">{entry.userName}</span>
                  <span className="text-muted-foreground">{entry.action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
