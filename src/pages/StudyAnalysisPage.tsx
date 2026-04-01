import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Search, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type CreateStudyInput, type UploadProgressSnapshot, splitFilesIntoUploadBatches } from "@/lib/api";
import { DEFAULT_STUDY_WORKSPACE, normalizeStudyWorkspace, STUDY_WORKSPACES } from "@/lib/study-workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

const INITIAL_FORM: CreateStudyInput = {
  studyWorkspace: DEFAULT_STUDY_WORKSPACE,
  crNo: "",
  patientName: "",
  age: null,
  gender: "M",
  phoneNumber: "",
  files: [],
};

export default function StudyAnalysisPage() {
  const params = useParams<{ workspace: string }>();
  const workspace = normalizeStudyWorkspace(params.workspace);
  const workspaceConfig = STUDY_WORKSPACES[workspace];
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formState, setFormState] = useState<CreateStudyInput>({
    ...INITIAL_FORM,
    studyWorkspace: workspace,
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgressSnapshot | null>(null);

  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
    setShowCreateDialog(false);
    setUploadProgress(null);
    setFormState({
      ...INITIAL_FORM,
      studyWorkspace: workspace,
    });
  }, [workspace]);

  const studiesQuery = useQuery({
    queryKey: ["studies", workspace],
    queryFn: () => api.listStudies(workspace),
  });

  const batchPreview = useMemo(() => {
    try {
      return {
        batchCount: splitFilesIntoUploadBatches(formState.files).length,
        error: null,
      };
    } catch (error) {
      return {
        batchCount: 0,
        error: error instanceof Error ? error.message : "Unable to prepare study image batches.",
      };
    }
  }, [formState.files]);

  const createStudyMutation = useMutation({
    mutationFn: (input: CreateStudyInput) =>
      api.createStudy(input, {
        onProgress: (progress) => setUploadProgress(progress),
      }),
    onSuccess: (dashboard) => {
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      queryClient.setQueryData(["study", dashboard.patientProfile.crNo], dashboard);
      toast({
        title: `${workspaceConfig.shortLabel} study created`,
        description: `${dashboard.patientProfile.patientName} has been created successfully.`,
      });
      setFormState({
        ...INITIAL_FORM,
        studyWorkspace: workspace,
      });
      setUploadProgress(null);
      setShowCreateDialog(false);
      navigate(`/patients/${dashboard.patientProfile.crNo}`);
    },
    onError: (error) => {
      setUploadProgress(null);
      toast({
        title: "Study creation failed",
        description: error instanceof Error ? error.message : "Unable to create the study.",
        variant: "destructive",
      });
    },
  });

  const filteredStudies = useMemo(() => {
    const studies = studiesQuery.data ?? [];
    return studies.filter((study) => {
      const searchValue = search.toLowerCase();
      const matchesSearch =
        study.patientName.toLowerCase().includes(searchValue) ||
        study.crNo.toLowerCase().includes(searchValue);
      const matchesStatus = statusFilter === "all" || study.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, studiesQuery.data]);

  const handleCreateStudy = (event: React.FormEvent) => {
    event.preventDefault();

    if (batchPreview.error) {
      toast({
        title: "Upload preparation failed",
        description: batchPreview.error,
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(null);
    createStudyMutation.mutate({
      ...formState,
      studyWorkspace: workspace,
    });
  };

  const progressValue = uploadProgress
    ? Math.round((uploadProgress.completedFiles / Math.max(uploadProgress.totalFiles, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {workspaceConfig.laneLabel}
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">{workspaceConfig.title}</h2>
              <p className="max-w-2xl text-muted-foreground">{workspaceConfig.description}</p>
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground/80">
              Signed in as {user?.role ?? "USER"} in {user?.name ?? "SGPGIMS"} workspace
            </p>
          </div>
          {hasPermission("create:study") && (
            <Dialog
              open={showCreateDialog}
              onOpenChange={(open) => {
                setShowCreateDialog(open);
                if (open) {
                  setFormState((current) => ({
                    ...current,
                    studyWorkspace: workspace,
                  }));
                } else {
                  setUploadProgress(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="min-w-44">
                  <Plus className="mr-2 h-4 w-4" />
                  {workspaceConfig.registerLabel}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">{workspaceConfig.registerTitle}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStudy} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="crNo">CR Number</Label>
                      <Input
                        id="crNo"
                        placeholder="CR-2026-0001"
                        value={formState.crNo}
                        onChange={(event) => setFormState((current) => ({ ...current, crNo: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="Patient phone"
                        value={formState.phoneNumber}
                        onChange={(event) => setFormState((current) => ({ ...current, phoneNumber: event.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      placeholder="Full name"
                      value={formState.patientName}
                      onChange={(event) => setFormState((current) => ({ ...current, patientName: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min={0}
                        max={120}
                        value={formState.age ?? ""}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            age: event.target.value ? Number(event.target.value) : null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={formState.gender}
                        onValueChange={(value) => setFormState((current) => ({ ...current, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {hasPermission("upload:images") && (
                    <div className="space-y-2">
                      <Label htmlFor="studyFiles">Study Images</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Attach DICOM, ZIP, PNG, or JPEG study files
                        </p>
                        <Input
                          id="studyFiles"
                          type="file"
                          multiple
                          accept=".dcm,.dicom,.zip,.png,.jpg,.jpeg"
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              files: Array.from(event.target.files ?? []),
                            }))
                          }
                        />
                      </div>
                      {formState.files.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formState.files.length} file(s) selected
                          {batchPreview.batchCount > 0 ? ` · uploads in ${batchPreview.batchCount} batch(es)` : ""}
                        </p>
                      )}
                      {batchPreview.error && (
                        <p className="text-xs text-destructive">{batchPreview.error}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Large image sets are uploaded in small batches so the web deployment can handle thousands of files safely.
                      </p>
                    </div>
                  )}

                  {createStudyMutation.isPending && (
                    <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {uploadProgress ? "Uploading study images in batches" : "Creating study record"}
                        </span>
                        {uploadProgress && (
                          <span className="text-muted-foreground">
                            {uploadProgress.completedFiles}/{uploadProgress.totalFiles} files
                          </span>
                        )}
                      </div>
                      <Progress value={uploadProgress ? progressValue : 10} />
                      <p className="text-xs text-muted-foreground">
                        {uploadProgress
                          ? `Batch ${uploadProgress.batchIndex} of ${uploadProgress.totalBatches}`
                          : "Saving the patient record before starting file uploads."}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createStudyMutation.isPending}>
                      {createStudyMutation.isPending ? "Saving..." : workspaceConfig.registerLabel}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={workspaceConfig.searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workflows</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">{workspaceConfig.tableTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CR No.</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Age/Gender</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Clinical</TableHead>
                <TableHead className="hidden lg:table-cell">Radiology</TableHead>
                <TableHead className="hidden lg:table-cell">AI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studiesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading studies...
                  </TableCell>
                </TableRow>
              )}
              {studiesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-destructive">
                    {studiesQuery.error instanceof Error ? studiesQuery.error.message : "Unable to load studies."}
                  </TableCell>
                </TableRow>
              )}
              {filteredStudies.map((study) => (
                <TableRow key={study.crNo} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{study.crNo}</TableCell>
                  <TableCell className="font-medium">{study.patientName}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {study.age ?? "NA"}y / {study.gender || "NA"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {study.phoneNumber || "NA"}
                  </TableCell>
                  <TableCell><StatusBadge status={study.status} /></TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.clinicalStatus} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.radiologyStatus} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.aiStatus === "in-progress" ? "processing" : study.aiStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/patients/${study.crNo}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!studiesQuery.isLoading && !studiesQuery.isError && filteredStudies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No {workspaceConfig.shortLabel} studies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
