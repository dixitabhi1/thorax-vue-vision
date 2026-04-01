import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { STUDY_WORKSPACES } from "@/lib/study-workspaces";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

function countPendingDepartments(study: Awaited<ReturnType<typeof api.listStudies>>[number]) {
  return [study.clinicalStatus, study.radiologyStatus, study.aiStatus].filter((status) => status !== "complete").length;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studiesQuery = useQuery({
    queryKey: ["studies"],
    queryFn: api.listStudies,
  });

  const studies = studiesQuery.data ?? [];
  const complete = studies.filter((study) => study.status === "complete").length;
  const inProgress = studies.filter((study) => study.status === "in-progress").length;
  const pending = studies.filter((study) => study.status === "pending").length;

  const priorityQueue = [...studies]
    .sort((left, right) => countPendingDepartments(right) - countPendingDepartments(left))
    .slice(0, 4);

  const backlog = [
    { label: "Pulmonary pending", value: studies.filter((study) => study.clinicalStatus === "pending").length, tone: "bg-amber-300" },
    { label: "Radiology pending", value: studies.filter((study) => study.radiologyStatus === "pending").length, tone: "bg-sky-300" },
    { label: "Dectrocel pending", value: studies.filter((study) => study.aiStatus !== "complete").length, tone: "bg-emerald-300" },
  ];

  const stats = [
    { label: "Completed cases", value: complete, icon: CheckCircle2 },
    { label: "Active workflows", value: inProgress, icon: Activity },
    { label: "Waiting to start", value: pending, icon: Clock },
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
      <div className="grid gap-4 xl:grid-cols-[1.8fr_0.9fr]">
        <Card>
          <CardContent className="p-6 space-y-3">
            <Badge variant="outline" className="text-[11px] uppercase tracking-[0.24em]">
              Live Hospital Dashboard
            </Badge>
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground">Welcome back, {user?.name}</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Here&apos;s the current thoracic workflow load across pulmonary, radiology, and Dectrocel. Every patient in this
                view is linked through a live cr_no record.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {Object.values(STUDY_WORKSPACES).map((workspace) => (
                <Button
                  key={workspace.key}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/studies/${workspace.key}`)}
                >
                  {workspace.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <p className="mt-4 text-3xl font-heading font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-heading text-lg">Priority patient queue</CardTitle>
              <p className="text-sm text-muted-foreground">Cases with the most departments still pending.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/patients")}>
              Open records
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityQueue.length > 0 ? (
              priorityQueue.map((study) => (
                <button
                  key={study.crNo}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/patients/${study.crNo}`)}
                >
                  <div>
                    <p className="font-medium text-foreground">{study.patientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {study.crNo} | {study.age ?? "NA"} / {study.gender || "NA"}
                    </p>
                  </div>
                  <StatusBadge status={study.status} />
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                No patient records are available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Department backlog</CardTitle>
            <p className="text-sm text-muted-foreground">Patients still waiting for each team&apos;s action.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {backlog.map((item) => (
              <div key={item.label} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-2xl font-heading font-semibold text-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${item.tone}`}
                    style={{ width: studies.length ? `${Math.max((item.value / studies.length) * 100, item.value ? 14 : 0)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-lg">Recent patient roster</CardTitle>
            <p className="text-sm text-muted-foreground">A quick view of the latest records connected to the API.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/studies")}>
            CT Thorax Study
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {studies.slice(0, 5).map((study) => (
            <button
              key={study.crNo}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/patients/${study.crNo}`)}
            >
              <div>
                <p className="font-medium text-foreground">{study.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {study.crNo} | {study.phoneNumber || "Phone not recorded"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {STUDY_WORKSPACES[study.workspace].title}
                </p>
              </div>
              <StatusBadge status={study.status} />
            </button>
          ))}
          {studies.length === 0 && (
            <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No studies have been created yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
