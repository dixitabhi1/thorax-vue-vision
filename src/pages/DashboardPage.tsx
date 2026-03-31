import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertTriangle, Activity, FileSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const studiesQuery = useQuery({
    queryKey: ["studies"],
    queryFn: api.listStudies,
  });

  const studies = studiesQuery.data ?? [];
  const totalStudies = studies.length;
  const complete = studies.filter((study) => study.status === "complete").length;
  const inProgress = studies.filter((study) => study.status === "in-progress").length;
  const pending = studies.filter((study) => study.status === "pending").length;

  const stats = [
    { label: "Total Studies", value: totalStudies, icon: FileSearch, color: "text-primary" },
    { label: "Complete", value: complete, icon: CheckCircle2, color: "text-success" },
    { label: "In Progress", value: inProgress, icon: Activity, color: "text-info" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning" },
  ];

  if (studiesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  }

  if (studiesQuery.isError) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-destructive">
          {studiesQuery.error instanceof Error ? studiesQuery.error.message : "Unable to load study metrics."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studies.slice(0, 5).map((study) => (
              <div
                key={study.crNo}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{study.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {study.crNo} · {study.phoneNumber || "Phone not recorded"}
                  </p>
                </div>
                <StatusBadge status={study.status} />
              </div>
            ))}
            {studies.length === 0 && (
              <p className="text-sm text-muted-foreground">No studies have been created yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-medium text-foreground">Pending Clinical Review</h3>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {studies.filter((study) => study.clinicalStatus === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-medium text-foreground">Pending Radiology Reports</h3>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {studies.filter((study) => study.radiologyStatus === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-info" />
              <h3 className="text-sm font-medium text-foreground">AI Reports Pending</h3>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {studies.filter((study) => study.aiStatus !== "complete").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
