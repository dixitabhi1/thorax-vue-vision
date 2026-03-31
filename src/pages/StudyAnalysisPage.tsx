import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Search, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, CreateStudyInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  crNo: "",
  patientName: "",
  age: null,
  gender: "M",
  phoneNumber: "",
  files: [],
};

export default function StudyAnalysisPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formState, setFormState] = useState<CreateStudyInput>(INITIAL_FORM);

  const studiesQuery = useQuery({
    queryKey: ["studies"],
    queryFn: api.listStudies,
  });

  const createStudyMutation = useMutation({
    mutationFn: api.createStudy,
    onSuccess: (dashboard) => {
      queryClient.invalidateQueries({ queryKey: ["studies"] });
      queryClient.setQueryData(["study", dashboard.patientProfile.crNo], dashboard);
      toast({
        title: "Study created",
        description: `${dashboard.patientProfile.patientName} has been created successfully.`,
      });
      setFormState(INITIAL_FORM);
      setShowCreateDialog(false);
      navigate(`/patients/${dashboard.patientProfile.crNo}`);
    },
    onError: (error) => {
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
    createStudyMutation.mutate(formState);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Study Analysis</h2>
          <p className="text-muted-foreground">Create thorax studies and track department progress</p>
        </div>
        {hasPermission("create:study") && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Study
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create New Study</DialogTitle>
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
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStudyMutation.isPending}>
                    {createStudyMutation.isPending ? "Creating..." : "Create Study"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or CR number..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
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
                    No studies found
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
