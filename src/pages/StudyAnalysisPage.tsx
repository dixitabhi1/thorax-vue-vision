import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MOCK_STUDIES, Study } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
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
import { Plus, Search, Eye, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudyAnalysisPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredStudies = MOCK_STUDIES.filter((s) => {
    const matchesSearch =
      s.patientName.toLowerCase().includes(search.toLowerCase()) ||
      s.crNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateStudy = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Study Created", description: "New study has been created successfully." });
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Study Analysis</h2>
          <p className="text-muted-foreground">Manage and review CT thorax studies</p>
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
                    <Label>CR Number</Label>
                    <Input placeholder="CR-2025-XXXX" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Study</Label>
                    <Input type="date" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Patient Name</Label>
                  <Input placeholder="Full name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" min={0} max={120} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select required>
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
                    <Label>DICOM Images</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop DICOM files or click to browse
                      </p>
                      <Input type="file" className="hidden" multiple accept=".dcm,.dicom" />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Study</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or CR number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CR No.</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Age/Gender</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Clinical</TableHead>
                <TableHead className="hidden lg:table-cell">Radiology</TableHead>
                <TableHead className="hidden lg:table-cell">AI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudies.map((study) => (
                <TableRow key={study.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{study.crNo}</TableCell>
                  <TableCell className="font-medium">{study.patientName}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {study.age}y / {study.gender}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {study.dateOfStudy}
                  </TableCell>
                  <TableCell><StatusBadge status={study.status} /></TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.clinicalStatus} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.radiologyStatus} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <StatusBadge status={study.aiStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/patients/${study.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudies.length === 0 && (
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
