import { useRef } from "react";
import { Brain, Upload, FileText, Eye } from "lucide-react";
import { StudyFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AIReportViewProps {
  data: StudyFile | null;
  canUpload: boolean;
  onUpload: (file: File) => Promise<unknown>;
  uploading: boolean;
}

export function AIReportView({ data, canUpload, onUpload, uploading }: AIReportViewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file",
        description: "AI reports must be uploaded as PDF files only.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    await onUpload(file);
    event.target.value = "";
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No AI report PDF has been uploaded yet.</p>
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload AI Report (PDF)"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-lg">AI Analysis Report</CardTitle>
            </div>
            {data.uploadedAt && (
              <Badge variant="secondary" className="text-xs">
                Uploaded: {new Date(data.uploadedAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <FileText className="h-8 w-8 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{data.name}</p>
              <p className="text-xs text-muted-foreground">
                {data.reportType || "AI report"} · {data.modality || "CT"}
              </p>
            </div>
            {data.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  View PDF
                </a>
              </Button>
            )}
          </div>

          {data.url ? (
            <div className="border border-border rounded-lg overflow-hidden bg-muted/50">
              <iframe
                src={data.url}
                title="AI Report PDF"
                className="w-full h-[600px]"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">A PDF has been registered, but no preview URL is available.</p>
          )}

          {canUpload && (
            <div className="flex justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Replace PDF"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
