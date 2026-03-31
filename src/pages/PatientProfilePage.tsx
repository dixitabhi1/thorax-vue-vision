import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, createEmptyPulmonaryForm, type PulmonaryFormValues } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    mutationFn: (files: File[]) => api.uploadStudyImages(crNo ?? "", files),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(["study", crNo], dashboard);
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      toast({ title: "Study images uploaded", description: "The study files were uploaded successfully." });
    },
    onError: (error) => {
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
  const aiStatus = study.status.aiStatus === "in-progress" ? "processing" : study.status.aiStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-heading font-bold text-foreground">{patient.patientName}</h2>
            <StatusBadge status={study.status.overallStatus} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="font-mono">{patient.crNo}</span>
            <span>{patient.age ?? "NA"}y / {patient.gender || "NA"}</span>
            <span>{patient.phoneNumber || "Phone not recorded"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall", status: study.status.overallStatus },
          { label: "Clinical", status: study.status.clinicalStatus },
          { label: "Radiology", status: study.status.radiologyStatus },
          { label: "AI Report", status: aiStatus },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <StatusBadge status={item.status} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="images" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="radiology">Radiology</TabsTrigger>
          <TabsTrigger value="ai">AI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
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
