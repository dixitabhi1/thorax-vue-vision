import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export default function PatientsPage() {
  const navigate = useNavigate();
  const studiesQuery = useQuery({
    queryKey: ["studies"],
    queryFn: api.listStudies,
  });

  if (studiesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading patient profiles...</p>;
  }

  if (studiesQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        {studiesQuery.error instanceof Error ? studiesQuery.error.message : "Unable to load patients."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Patient Records</h2>
        <p className="text-muted-foreground">Open the consolidated case workspace for pulmonary, radiology, and Dectrocel updates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studiesQuery.data?.map((study) => (
          <Card
            key={study.crNo}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/patients/${study.crNo}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{study.patientName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{study.crNo}</p>
                  </div>
                </div>
                <StatusBadge status={study.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{study.age ?? "NA"}y / {study.gender || "NA"}</span>
                <span>{study.phoneNumber || "Phone not recorded"}</span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <StatusBadge status={study.clinicalStatus} />
                <StatusBadge status={study.radiologyStatus} />
                <StatusBadge status={study.aiStatus === "in-progress" ? "processing" : study.aiStatus} />
              </div>
            </CardContent>
          </Card>
        ))}
        {studiesQuery.data?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No patient records have been created yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
