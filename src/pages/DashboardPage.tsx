import { MOCK_STUDIES } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const studies = MOCK_STUDIES;

  const totalStudies = studies.length;
  const complete = studies.filter((s) => s.status === "complete").length;
  const inProgress = studies.filter((s) => s.status === "in-progress").length;
  const pending = studies.filter((s) => s.status === "pending").length;

  const stats = [
    { label: "Total Studies", value: totalStudies, icon: FileSearch, color: "text-primary" },
    { label: "Complete", value: complete, icon: CheckCircle2, color: "text-success" },
    { label: "In Progress", value: inProgress, icon: Activity, color: "text-info" },
    { label: "Pending", value: pending, icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Metrics */}
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

      {/* Recent Studies */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Recent Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studies.slice(0, 5).map((study) => (
              <div
                key={study.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{study.patientName}</p>
                    <p className="text-xs text-muted-foreground">{study.crNo} · {study.dateOfStudy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={study.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-medium text-foreground">Pending Clinical Review</h3>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {studies.filter((s) => s.clinicalStatus === "pending").length}
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
              {studies.filter((s) => s.radiologyStatus === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-info" />
              <h3 className="text-sm font-medium text-foreground">AI Processing</h3>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {studies.filter((s) => s.aiStatus === "processing").length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
