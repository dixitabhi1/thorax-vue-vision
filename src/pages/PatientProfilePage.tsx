import { useParams, useNavigate } from "react-router-dom";
import { MOCK_STUDIES, MOCK_CLINICAL, MOCK_RADIOLOGY, MOCK_AI } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ImageViewer } from "@/components/patient/ImageViewer";
import { ClinicalForm } from "@/components/patient/ClinicalForm";
import { RadiologyReportView } from "@/components/patient/RadiologyReportView";
import { AIReportView } from "@/components/patient/AIReportView";
import { ArrowLeft, User } from "lucide-react";

export default function PatientProfilePage() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const study = MOCK_STUDIES.find((s) => s.id === studyId);

  if (!study) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-heading font-semibold text-foreground">Study Not Found</h2>
          <p className="text-muted-foreground">The requested study does not exist.</p>
          <Button variant="outline" onClick={() => navigate("/studies")}>
            Back to Studies
          </Button>
        </div>
      </div>
    );
  }

  const clinical = MOCK_CLINICAL[study.id];
  const radiology = MOCK_RADIOLOGY[study.id];
  const aiReport = MOCK_AI[study.id];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-heading font-bold text-foreground">{study.patientName}</h2>
            <StatusBadge status={study.status} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{study.crNo}</span>
            <span>{study.age}y / {study.gender === "M" ? "Male" : study.gender === "F" ? "Female" : "Other"}</span>
            <span>Study Date: {study.dateOfStudy}</span>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall", status: study.status },
          { label: "Clinical", status: study.clinicalStatus },
          { label: "Radiology", status: study.radiologyStatus },
          { label: "AI Analysis", status: study.aiStatus },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <StatusBadge status={item.status} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="images" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="radiology">Radiology</TabsTrigger>
          <TabsTrigger value="ai">AI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <ImageViewer
            images={study.images}
            canUpload={hasPermission("upload:images")}
          />
        </TabsContent>

        <TabsContent value="clinical">
          <ClinicalForm
            data={clinical}
            canEdit={hasPermission("edit:clinical")}
            studyId={study.id}
          />
        </TabsContent>

        <TabsContent value="radiology">
          <RadiologyReportView
            data={radiology}
            canEdit={hasPermission("edit:radiology")}
            studyId={study.id}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AIReportView data={aiReport} canEdit={hasPermission("edit:ai-report")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
