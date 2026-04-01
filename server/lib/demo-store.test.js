// @vitest-environment node

import { describe, expect, it } from "vitest";
import { mergeStudyDashboard } from "./demo-store.js";
import { emptyPulmonaryForm } from "./normalize.js";

describe("study cache merge helpers", () => {
  it("preserves cached workflow data when the fresh dashboard is partial", () => {
    const merged = mergeStudyDashboard(
      {
        workspace: "ct-thorax",
        patientProfile: {
          crNo: "CR-101",
          patientName: "Test Patient",
          age: 25,
          gender: "M",
          phoneNumber: "9999999999",
        },
        pulmonaryForm: {
          ...emptyPulmonaryForm(),
          updatedAt: null,
          updatedBy: null,
        },
        radiologyReport: null,
        aiReport: null,
        studyImages: [],
        status: {
          overallStatus: "pending",
          clinicalStatus: "pending",
          radiologyStatus: "pending",
          aiStatus: "pending",
          dectrocelStatus: "pending",
        },
        auditLog: [],
      },
      {
        workspace: "ct-thorax",
        patientProfile: {
          crNo: "CR-101",
          patientName: "Test Patient",
          age: 25,
          gender: "M",
          phoneNumber: "9999999999",
        },
        pulmonaryForm: {
          ...emptyPulmonaryForm(),
          remarks: "Needs pulmonary follow-up",
          updatedAt: "2026-04-01T00:00:00.000Z",
          updatedBy: "Dr. Pulmonary User",
        },
        radiologyReport: {
          radiologicalImpression: "Stable thoracic findings",
          reportedBy: "Dr. Radiology User",
          reportDate: "2026-04-01T00:05:00.000Z",
        },
        aiReport: {
          id: "pdf-1",
          name: "ai-report.pdf",
          url: "https://example.com/ai-report.pdf",
          fileType: null,
          reportType: "AI_REPORT",
          modality: "CT",
          contentType: "application/pdf",
          uploadedAt: "2026-04-01T00:10:00.000Z",
          kind: "pdf",
        },
        studyImages: [
          {
            id: "img-1",
            name: "slice-1.png",
            url: "https://example.com/slice-1.png",
            fileType: "PNG",
            reportType: null,
            modality: "CT",
            contentType: "image/png",
            uploadedAt: "2026-04-01T00:02:00.000Z",
            kind: "study-image",
          },
        ],
        status: {
          overallStatus: "complete",
          clinicalStatus: "complete",
          radiologyStatus: "complete",
          aiStatus: "complete",
          dectrocelStatus: "complete",
        },
        auditLog: [
          {
            timestamp: "2026-04-01T00:05:00.000Z",
            userName: "Dr. Radiology User",
            userRole: "RADIOLOGY",
            action: "Created radiology report",
          },
        ],
      },
    );

    expect(merged.pulmonaryForm.remarks).toBe("Needs pulmonary follow-up");
    expect(merged.workspace).toBe("ct-thorax");
    expect(merged.radiologyReport?.radiologicalImpression).toContain("Stable thoracic findings");
    expect(merged.aiReport?.name).toBe("ai-report.pdf");
    expect(merged.studyImages).toHaveLength(1);
    expect(merged.auditLog).toHaveLength(1);
    expect(merged.status.overallStatus).toBe("complete");
  });

  it("keeps in-progress department state from the latest dashboard", () => {
    const merged = mergeStudyDashboard(
      {
        workspace: "ncg",
        patientProfile: {
          crNo: "CR-102",
          patientName: "Workflow Patient",
          age: null,
          gender: null,
          phoneNumber: null,
        },
        pulmonaryForm: {
          ...emptyPulmonaryForm(),
          updatedAt: null,
          updatedBy: null,
        },
        radiologyReport: null,
        aiReport: null,
        studyImages: [],
        status: {
          overallStatus: "in-progress",
          clinicalStatus: "pending",
          radiologyStatus: "pending",
          aiStatus: "in-progress",
          dectrocelStatus: "in-progress",
        },
        auditLog: [],
      },
      null,
    );

    expect(merged.workspace).toBe("ncg");
    expect(merged.status.aiStatus).toBe("in-progress");
    expect(merged.status.overallStatus).toBe("in-progress");
  });
});
