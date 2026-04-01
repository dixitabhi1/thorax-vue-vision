import path from "node:path";
import { normalizeStudyWorkspace } from "./study-workspaces.js";

export const PULMONARY_FIELDS = [
  "cough",
  "dyspnea_grade",
  "expectoration",
  "hemoptysis",
  "chest_tightness",
  "t2dm",
  "htn",
  "cad",
  "tb",
  "covid",
  "childhood_pneumonia",
  "smoking_exposure",
  "hb",
  "haemoglobin",
  "tlc",
  "dlc_n_l_e",
  "total_ige",
  "hba1c",
  "pulmonary_hypertension",
  "fev1",
  "fvc",
  "fev1_fvc",
  "emphysema",
  "bullae_cyst",
  "nodules_ggo",
  "mediastinal_ln",
  "pleural_effusion",
  "pneumothorax",
  "ecg",
  "ana",
  "ena",
  "ra",
  "msa",
  "s_calcium",
  "s_ace",
  "remarks",
];

const DEFAULT_DEPARTMENT_STATUS = "pending";

function cleanString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function cleanOptionalString(value) {
  const normalized = cleanString(value);
  return normalized || null;
}

function asList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.files)) {
    return value.files;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function pickValue(record, keys) {
  if (!record || typeof record !== "object") {
    return undefined;
  }

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function pickString(record, keys) {
  return cleanOptionalString(pickValue(record, keys));
}

function pickNumber(record, keys) {
  const value = pickValue(record, keys);
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function deriveFileName(record) {
  const explicitName = pickString(record, [
    "file_name",
    "filename",
    "name",
    "original_filename",
    "report_name",
  ]);

  if (explicitName) {
    return explicitName;
  }

  const url = pickString(record, [
    "url",
    "file_url",
    "download_url",
    "public_url",
    "signed_url",
    "path",
  ]);

  if (!url) {
    return null;
  }

  try {
    const pathnameFromUrl = new URL(url).pathname;
    return decodeURIComponent(path.basename(pathnameFromUrl));
  } catch {
    return decodeURIComponent(path.basename(url));
  }
}

function deriveFileKind(record) {
  const fileType = pickString(record, ["file_type"]);
  const reportType = pickString(record, ["report_type"]);
  const contentType = pickString(record, ["content_type", "mime_type"]);
  const name = deriveFileName(record);
  const ext = name ? path.extname(name).toLowerCase() : "";

  if (reportType === "AI_REPORT" || reportType === "FINAL_REPORT") {
    return "pdf";
  }

  if (contentType?.includes("pdf") || ext === ".pdf") {
    return "pdf";
  }

  if (["PNG", "JPG", "JPEG", "DICOM", "ZIP", "OTHER"].includes(fileType ?? "")) {
    return "study-image";
  }

  if ([".png", ".jpg", ".jpeg", ".dcm", ".dicom", ".zip"].includes(ext)) {
    return "study-image";
  }

  return null;
}

function dedupeFiles(records) {
  const seen = new Set();
  const deduped = [];

  records.forEach((record) => {
    const key = `${record.url ?? ""}::${record.name ?? ""}::${record.fileType ?? ""}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    deduped.push(record);
  });

  return deduped;
}

function latestByTimestamp(records) {
  return [...records].sort((left, right) => {
    const leftDate = pickString(left, ["uploaded_at", "created_at", "report_date", "updated_at"]);
    const rightDate = pickString(right, ["uploaded_at", "created_at", "report_date", "updated_at"]);

    return new Date(rightDate ?? 0).getTime() - new Date(leftDate ?? 0).getTime();
  })[0] ?? null;
}

export function emptyPulmonaryForm() {
  return Object.fromEntries(PULMONARY_FIELDS.map((field) => [field, ""]));
}

export function normalizeDepartmentStatus(value) {
  const normalized = cleanString(value).toUpperCase();

  if (normalized === "COMPLETED" || normalized === "COMPLETE") {
    return "complete";
  }

  if (normalized === "PROCESSING" || normalized === "IN_PROGRESS") {
    return "in-progress";
  }

  return DEFAULT_DEPARTMENT_STATUS;
}

export function normalizePatientProfile(record) {
  return {
    crNo: pickString(record, ["cr_no", "crNo", "id"]) ?? "",
    patientName: pickString(record, ["patient_name", "patientName", "name"]) ?? "",
    age: pickNumber(record, ["age"]),
    gender: pickString(record, ["gender"]),
    phoneNumber: pickString(record, ["phone_number", "phoneNumber", "mobile_number"]),
  };
}

export function normalizePulmonaryForm(record) {
  const baseForm = emptyPulmonaryForm();

  if (!record || typeof record !== "object") {
    return {
      ...baseForm,
      updatedAt: null,
      updatedBy: null,
    };
  }

  PULMONARY_FIELDS.forEach((field) => {
    baseForm[field] = cleanString(record[field]);
  });

  return {
    ...baseForm,
    updatedAt: pickString(record, ["updated_at", "created_at", "report_date"]),
    updatedBy: pickString(record, ["updated_by", "created_by", "full_name", "reported_by"]),
  };
}

export function normalizeRadiologyRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  return {
    radiologicalImpression:
      pickString(record, ["radiological_impression", "impression", "report_text", "report"]) ?? "",
    reportedBy: pickString(record, ["reported_by", "full_name", "radiologist_name", "created_by"]),
    reportDate: pickString(record, ["report_date", "created_at", "updated_at"]),
  };
}

export function normalizeFileRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const name = deriveFileName(record);
  const url = pickString(record, [
    "url",
    "file_url",
    "download_url",
    "public_url",
    "signed_url",
    "path",
  ]);

  if (!name && !url) {
    return null;
  }

  return {
    id: pickString(record, ["id", "uuid"]) ?? `${name ?? "file"}-${url ?? ""}`,
    name: name ?? "Unnamed file",
    url,
    fileType: pickString(record, ["file_type"]),
    reportType: pickString(record, ["report_type"]),
    modality: pickString(record, ["modality"]),
    contentType: pickString(record, ["content_type", "mime_type"]),
    uploadedAt: pickString(record, ["uploaded_at", "created_at", "report_date"]),
    kind: deriveFileKind(record),
  };
}

export function normalizeStudyStatus({ statusRecord, hasPulmonary, hasRadiology, hasAiReport, hasStudyImages }) {
  const clinicalStatus = hasPulmonary
    ? "complete"
    : normalizeDepartmentStatus(pickValue(statusRecord, ["pulmonary_status", "clinical_status"]));
  const radiologyStatus = hasRadiology
    ? "complete"
    : normalizeDepartmentStatus(pickValue(statusRecord, ["radiology_status"]));
  const aiStatus = hasAiReport
    ? "complete"
    : normalizeDepartmentStatus(pickValue(statusRecord, ["dectrocel_status", "ai_status"]));

  let overallStatus = "pending";

  if (clinicalStatus === "complete" && radiologyStatus === "complete" && aiStatus === "complete") {
    overallStatus = "complete";
  } else if (hasPulmonary || hasRadiology || hasAiReport || hasStudyImages) {
    overallStatus = "in-progress";
  }

  return {
    overallStatus,
    clinicalStatus,
    radiologyStatus,
    aiStatus,
    dectrocelStatus: normalizeDepartmentStatus(pickValue(statusRecord, ["dectrocel_status"])),
  };
}

export function normalizeDashboardResponse({ crNo, dashboardPayload, filesPayload, auditLog, workspace }) {
  const patientProfile = normalizePatientProfile(dashboardPayload?.patient_profile ?? { cr_no: crNo });
  const pulmonaryEntries = asList(dashboardPayload?.pulmonary);
  const radiologyEntries = asList(dashboardPayload?.radiology);
  const pdfRecords = asList(dashboardPayload?.pdf_reports);
  const studyImageRecords = asList(dashboardPayload?.study_images);
  const extraFiles = asList(filesPayload);

  const normalizedPdfFiles = dedupeFiles(
    [...pdfRecords, ...extraFiles]
      .map(normalizeFileRecord)
      .filter((file) => file && file.kind === "pdf"),
  );

  const normalizedStudyImages = dedupeFiles(
    [...studyImageRecords, ...extraFiles]
      .map(normalizeFileRecord)
      .filter((file) => file && file.kind === "study-image"),
  );

  const latestPulmonary = latestByTimestamp(pulmonaryEntries);
  const latestRadiology = latestByTimestamp(radiologyEntries);
  const latestAiReport = latestByTimestamp(normalizedPdfFiles);

  const status = normalizeStudyStatus({
    statusRecord: dashboardPayload?.status ?? null,
    hasPulmonary: Boolean(latestPulmonary),
    hasRadiology: Boolean(latestRadiology),
    hasAiReport: Boolean(latestAiReport),
    hasStudyImages: normalizedStudyImages.length > 0,
  });

  return {
    workspace: normalizeStudyWorkspace(
      workspace ??
      dashboardPayload?.study_workspace ??
      dashboardPayload?.studyWorkspace,
    ),
    patientProfile,
    pulmonaryForm: normalizePulmonaryForm(latestPulmonary),
    radiologyReport: normalizeRadiologyRecord(latestRadiology),
    aiReport: latestAiReport,
    studyImages: normalizedStudyImages,
    status,
    auditLog,
  };
}

export function normalizeStudySummary(dashboard) {
  return {
    workspace: normalizeStudyWorkspace(dashboard.workspace),
    crNo: dashboard.patientProfile.crNo,
    patientName: dashboard.patientProfile.patientName,
    age: dashboard.patientProfile.age,
    gender: dashboard.patientProfile.gender,
    phoneNumber: dashboard.patientProfile.phoneNumber,
    status: dashboard.status.overallStatus,
    clinicalStatus: dashboard.status.clinicalStatus,
    radiologyStatus: dashboard.status.radiologyStatus,
    aiStatus: dashboard.status.aiStatus,
    studyImageCount: dashboard.studyImages.length,
    aiReportCount: dashboard.aiReport ? 1 : 0,
  };
}

export function appendRadiologistSignature(reportText, radiologistName) {
  const normalizedReport = cleanString(reportText).replace(/\n+$/, "");
  const normalizedName = cleanString(radiologistName);

  if (!normalizedReport || !normalizedName) {
    return normalizedReport;
  }

  const signature = `Reported by ${normalizedName}`;
  if (normalizedReport.toLowerCase().includes(signature.toLowerCase())) {
    return normalizedReport;
  }

  return `${normalizedReport}\n\n${signature}`;
}

export function inferStudyFileType(fileName = "", mimeType = "") {
  const ext = path.extname(fileName).toLowerCase();
  const normalizedMimeType = cleanString(mimeType).toLowerCase();

  if ([".dcm", ".dicom"].includes(ext)) {
    return "DICOM";
  }

  if (ext === ".zip" || normalizedMimeType.includes("zip")) {
    return "ZIP";
  }

  if (ext === ".png" || normalizedMimeType.includes("png")) {
    return "PNG";
  }

  if (ext === ".jpg" || ext === ".jpeg" || normalizedMimeType.includes("jpeg")) {
    return "JPEG";
  }

  return "OTHER";
}

export function isPdfFile(file) {
  const fileName = cleanString(file?.originalname ?? file?.name).toLowerCase();
  const mimeType = cleanString(file?.mimetype ?? file?.type).toLowerCase();
  return fileName.endsWith(".pdf") || mimeType === "application/pdf";
}

export function sanitizePulmonaryPayload(input) {
  const payload = {};

  PULMONARY_FIELDS.forEach((field) => {
    payload[field] = cleanOptionalString(input?.[field]);
  });

  return payload;
}
