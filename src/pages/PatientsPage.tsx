import { useNavigate } from "react-router-dom";
import { MOCK_STUDIES } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Eye, User } from "lucide-react";

export default function PatientsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Patient Profiles</h2>
        <p className="text-muted-foreground">View consolidated patient data across all studies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_STUDIES.map((study) => (
          <Card key={study.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/patients/${study.id}`)}>
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
                <span>{study.age}y / {study.gender}</span>
                <span>{study.dateOfStudy}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <StatusBadge status={study.clinicalStatus} />
                <StatusBadge status={study.radiologyStatus} />
                <StatusBadge status={study.aiStatus} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
