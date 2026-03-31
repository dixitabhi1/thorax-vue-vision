import { useState } from "react";
import { RadiologyReport, RadiologyAuditEntry, MOCK_RADIOLOGY_AUDIT } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Edit2, Clock, ShieldCheck } from "lucide-react";

interface RadiologyReportViewProps {
  data?: RadiologyReport;
  canEdit: boolean;
  studyId: string;
  showAudit?: boolean;
}

export function RadiologyReportView({ data, canEdit, studyId, showAudit = false }: RadiologyReportViewProps) {
  const [editing, setEditing] = useState(false);
  const [findings, setFindings] = useState(data?.findings || "");
  const [impression, setImpression] = useState(data?.impression || "");
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = canEdit && editing;

  const auditLog: RadiologyAuditEntry[] = MOCK_RADIOLOGY_AUDIT[studyId] || [];

  const handleSave = () => {
    if (!findings.trim() && !impression.trim()) {
      toast({ title: "Validation Error", description: "Findings or impression cannot both be empty.", variant: "destructive" });
      return;
    }
    // Auto-attach radiologist name and generate audit entry
    const newAuditEntry: RadiologyAuditEntry = {
      timestamp: new Date().toISOString(),
      userId: user?.id || "",
      userName: user?.name || "Unknown",
      action: data ? "Updated radiology report" : "Created radiology report",
    };
    auditLog.push(newAuditEntry);

    toast({
      title: "Saved",
      description: `Radiology report saved by ${user?.name}. Audit log updated.`,
    });
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
    <div className="space-y-4">
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Findings</Label>
              {isEditing ? (
                <Textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows={6}
                  placeholder="Describe CT findings in detail..."
                />
              ) : (
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded leading-relaxed whitespace-pre-wrap">
                  {data?.findings || "—"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Impression</Label>
              {isEditing ? (
                <Textarea
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  rows={4}
                  placeholder="Overall impression and diagnosis..."
                />
              ) : (
                <p className="text-sm text-foreground bg-muted p-3 rounded font-medium whitespace-pre-wrap">
                  {data?.impression || "—"}
                </p>
              )}
            </div>
          </div>

          {/* Auto-attached info banner */}
          {isEditing && (
            <div className="flex items-center gap-2 p-3 rounded bg-primary/10 border border-primary/20 text-sm text-primary">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>Report will be auto-signed as <strong>{user?.name}</strong> with timestamp on save.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log — visible to ADMIN only */}
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
              {auditLog.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs p-2 rounded bg-muted">
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
