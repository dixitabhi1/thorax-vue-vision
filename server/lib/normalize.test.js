// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  appendRadiologistSignature,
  inferStudyFileType,
  isPdfFile,
  normalizeDashboardResponse,
} from "./normalize.js";

describe("normalize utilities", () => {
  it("appends the radiologist signature once", () => {
    const withSignature = appendRadiologistSignature("Findings are stable.", "Dr. Gupta");
    const secondPass = appendRadiologistSignature(withSignature, "Dr. Gupta");

    expect(withSignature).toContain("Reported by Dr. Gupta");
    expect(secondPass).toBe(withSignature);
  });

  it("classifies supported study file types and PDF uploads", () => {
    expect(inferStudyFileType("scan.dcm", "application/octet-stream")).toBe("DICOM");
    expect(inferStudyFileType("archive.zip", "application/zip")).toBe("ZIP");
    expect(inferStudyFileType("slice.jpeg", "image/jpeg")).toBe("JPEG");
    expect(isPdfFile({ originalname: "report.pdf", mimetype: "application/pdf" })).toBe(true);
    expect(isPdfFile({ originalname: "scan.zip", mimetype: "application/zip" })).toBe(false);
  });

  it("normalizes dashboard payloads into the frontend study shape", () => {
    const dashboard = normalizeDashboardResponse({
      crNo: "CR-001",
      dashboardPayload: {
        patient_profile: {
          cr_no: "CR-001",
          patient_name: "Rajesh Kumar",
          age: 58,
          gender: "M",
          phone_number: "9999999999",
        },
        pulmonary: [
          {
            cough: "Dry cough",
            dyspnea_grade: "Grade II",
            remarks: "Needs follow-up",
            created_at: "2026-03-31T10:00:00Z",
            created_by: "Dr. Verma",
          },
        ],
        radiology: [
          {
            radiological_impression: "Moderate emphysema",
            reported_by: "Dr. Gupta",
            report_date: "2026-03-31T11:00:00Z",
          },
        ],
        pdf_reports: [
          {
            file_name: "AI_Report_CR-001.pdf",
            file_url: "https://example.com/ai-report.pdf",
            report_type: "AI_REPORT",
            uploaded_at: "2026-03-31T12:00:00Z",
          },
        ],
        study_images: [
          {
            file_name: "slice-1.png",
            file_url: "https://example.com/slice-1.png",
            file_type: "PNG",
            uploaded_at: "2026-03-31T09:00:00Z",
          },
        ],
        status: {
          pulmonary_status: "COMPLETED",
          radiology_status: "COMPLETED",
          dectrocel_status: "COMPLETED",
        },
      },
      filesPayload: [],
      auditLog: [
        {
          timestamp: "2026-03-31T11:05:00Z",
          userName: "Dr. Gupta",
          userRole: "RADIOLOGY",
          action: "Created radiology report",
        },
      ],
    });

    expect(dashboard.patientProfile.crNo).toBe("CR-001");
    expect(dashboard.status.overallStatus).toBe("complete");
    expect(dashboard.pulmonaryForm.dyspnea_grade).toBe("Grade II");
    expect(dashboard.radiologyReport?.radiologicalImpression).toContain("Moderate emphysema");
    expect(dashboard.aiReport?.name).toBe("AI_Report_CR-001.pdf");
    expect(dashboard.studyImages).toHaveLength(1);
    expect(dashboard.auditLog).toHaveLength(1);
  });
});
