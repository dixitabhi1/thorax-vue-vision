import { useState, useRef } from "react";
import { AIReport } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Upload, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AIReportViewProps {
  data?: AIReport;
  canUpload: boolean;
}

export function AIReportView({ data, canUpload }: AIReportViewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  const currentReport = uploadedFile
    ? { pdfFileName: uploadedFile.name, pdfUrl: uploadedFile.url, uploadedBy: "Current User", uploadedAt: new Date().toISOString() }
    : data;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File", description: "Only PDF files are allowed.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedFile({ name: file.name, url });
    toast({ title: "Uploaded", description: `AI report "${file.name}" uploaded successfully.` });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!currentReport) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No AI report has been uploaded yet.</p>
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload AI Report (PDF)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="font-heading text-lg">AI Analysis Report</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              Uploaded: {new Date(currentReport.uploadedAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <FileText className="h-8 w-8 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentReport.pdfFileName}</p>
              <p className="text-xs text-muted-foreground">
                Uploaded by {currentReport.uploadedBy}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={currentReport.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                View PDF
              </a>
            </Button>
          </div>

          {/* PDF preview */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/50">
            <iframe
              src={currentReport.pdfUrl}
              title="AI Report PDF"
              className="w-full h-[600px]"
            />
          </div>

          {/* Re-upload option */}
          {canUpload && (
            <div className="flex justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Replace AI Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
