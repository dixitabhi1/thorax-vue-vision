import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, createEmptyPulmonaryForm, type PulmonaryFormValues, type UploadProgressSnapshot } from "@/lib/api";
import { STUDY_WORKSPACES } from "@/lib/study-workspaces";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { ImageViewer } from "@/components/patient/ImageViewer";
import { ClinicalForm } from "@/components/patient/ClinicalForm";
import { RadiologyReportView } from "@/components/patient/RadiologyReportView";
import { AIReportView } from "@/components/patient/AIReportView";
import { useToast } from "@/hooks/use-toast";

export default function PatientProfilePage() {
  const { crNo } = useParams<{ crNo: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const [imageUploadProgress, setImageUploadProgress] = useState<UploadProgressSnapshot | null>(null);

  const studyQuery = useQuery({
    queryKey: ["study", crNo],
    queryFn: () => api.getStudy(crNo ?? ""),
    enabled: Boolean(crNo),
  });

  const updateClinicalMutation = useMutation({
    mutationFn: (payload: Partial<PulmonaryFormValues>) => api.saveClinical(crNo ?? "", payload),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["study", crNo], dashboard);
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      toast({ title: "Clinical form saved", description: "Pulmonary data has been updated." });
    },
    onError: (error) => {
      toast({
        title: "Clinical save failed",
        description: error instanceof Error ? error.message : "Unable to save the pulmonary form.",
        variant: "destructive",
      });
    },
  });

  const updateRadiologyMutation = useMutation({
    mutationFn: (radiologicalImpression: string) =>
      api.saveRadiology(crNo ?? "", {
        radiologicalImpression,
        radiologistName: user?.name ?? "",
      }),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["study", crNo], dashboard);
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      toast({ title: "Radiology report saved", description: "The report and audit trail were updated." });
    },
    onError: (error) => {
      toast({
        title: "Radiology save failed",
        description: error instanceof Error ? error.message : "Unable to save the radiology report.",
        variant: "destructive",
      });
    },
  });

  const uploadAiReportMutation = useMutation({
    mutationFn: (file: File) => api.uploadAiReport(crNo ?? "", file),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["study", crNo], dashboard);
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      toast({ title: "AI report uploaded", description: "The PDF report is now attached to the study." });
    },
    onError: (error) => {
      toast({
        title: "AI report upload failed",
        description: error instanceof Error ? error.message : "Unable to upload the AI report.",
        variant: "destructive",
      });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) =>
      api.uploadStudyImages(crNo ?? "", files, {
        onProgress: (progress) => setImageUploadProgress(progress),
      }),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["study", crNo], dashboard);
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      setImageUploadProgress(null);
      toast({ title: "Study images uploaded", description: "The study files were uploaded successfully." });
    },
    onError: (error) => {
      setImageUploadProgress(null);
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Unable to upload study files.",
        variant: "destructive",
      });
    },
  });

  if (studyQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading patient profile...</p>;
  }

  if (studyQuery.isError || !studyQuery.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-heading font-semibold text-foreground">Study Not Found</h2>
          <p className="text-muted-foreground">
            {studyQuery.error instanceof Error ? studyQuery.error.message : "The requested study does not exist."}
          </p>
          <Button variant="outline" onClick={() => navigate("/studies")}>
            Back to Studies
          </Button>
        </div>
      </div>
    );
  }

  const study = studyQuery.data;
  const patient = study.patientProfile;
  const workspaceConfig = STUDY_WORKSPACES[study.workspace];
  const aiStatus = study.status.aiStatus === "in-progress" ? "processing" : study.status.aiStatus;
  const pulmonaryNotesCount = Object.entries(study.pulmonaryForm ?? {}).some(
    ([key, value]) => !["updatedAt", "updatedBy"].includes(key) && String(value ?? "").trim().length > 0,
  )
    ? 1
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" onClick={() => navigate(`/studies/${study.workspace}`)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-heading font-bold text-foreground">{patient.patientName}</h2>
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.24em]">
              {workspaceConfig.title}
            </Badge>
            <StatusBadge status={study.status.overallStatus} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="font-mono">{patient.crNo}</span>
            <span>{patient.age ?? "NA"}y / {patient.gender || "NA"}</span>
            <span>{patient.phoneNumber || "Phone not recorded"}</span>
          </div>
        </div>
      </div>

      {uploadImagesMutation.isPending && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Uploading study images in batches</span>
              {imageUploadProgress && (
                <span className="text-muted-foreground">
                  {imageUploadProgress.completedFiles}/{imageUploadProgress.totalFiles} files
                </span>
              )}
            </div>
            <Progress
              value={imageUploadProgress ? Math.round((imageUploadProgress.completedFiles / Math.max(imageUploadProgress.totalFiles, 1)) * 100) : 10}
            />
            <p className="text-xs text-muted-foreground">
              {imageUploadProgress
                ? `Batch ${imageUploadProgress.batchIndex} of ${imageUploadProgress.totalBatches}`
                : "Preparing upload batches."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Pulmonary Notes", value: pulmonaryNotesCount },
          { label: "PDF Reports", value: study.aiReport ? 1 : 0 },
          { label: "Study Files", value: study.studyImages.length },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-3xl font-heading font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall", status: study.status.overallStatus },
          { label: "Pulmonary", status: study.status.clinicalStatus },
          { label: "Radiology", status: study.status.radiologyStatus },
          { label: "Dectrocel", status: aiStatus },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <StatusBadge status={item.status} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="study-files" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="study-files">Study Files</TabsTrigger>
          <TabsTrigger value="clinical">Pulmonary</TabsTrigger>
          <TabsTrigger value="radiology">Radiology</TabsTrigger>
          <TabsTrigger value="ai">Dectrocel</TabsTrigger>
        </TabsList>

        <TabsContent value="study-files">
          <ImageViewer
            files={study.studyImages}
            canUpload={hasPermission("upload:images")}
            onUpload={uploadImagesMutation.mutateAsync}
            uploading={uploadImagesMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="clinical">
          <ClinicalForm
            data={study.pulmonaryForm || createEmptyPulmonaryForm()}
            canEdit={hasPermission("edit:clinical")}
            onSave={(payload) => updateClinicalMutation.mutateAsync(payload)}
            saving={updateClinicalMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="radiology">
          <RadiologyReportView
            data={study.radiologyReport}
            canEdit={hasPermission("edit:radiology")}
            radiologistName={user?.name ?? ""}
            showAudit={user?.role === "ADMIN"}
            auditLog={study.auditLog}
            onSave={(text) => updateRadiologyMutation.mutateAsync(text)}
            saving={updateRadiologyMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AIReportView
            data={study.aiReport}
            canUpload={hasPermission("edit:ai-report")}
            onUpload={(file) => uploadAiReportMutation.mutateAsync(file)}
            uploading={uploadAiReportMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
