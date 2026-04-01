import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoStorePath } from "../config.js";
import { HttpError } from "./http-error.js";
import { emptyPulmonaryForm, inferStudyFileType, normalizeStudySummary } from "./normalize.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasText(value) {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

function normalizeWorkflowStatusValue(value) {
  return value === "complete" || value === "in-progress" ? value : "pending";
}

function normalizeDepartmentStatusValue(value) {
  return value === "complete" ? "complete" : "pending";
}

async function ensureStore() {
  await fs.mkdir(path.dirname(demoStorePath), { recursive: true });

  try {
    await fs.access(demoStorePath);
  } catch {
    await fs.writeFile(
      demoStorePath,
      JSON.stringify({ studies: {} }, null, 2),
      "utf8",
    );
  }
}

async function readState() {
  await ensureStore();
  const raw = await fs.readFile(demoStorePath, "utf8");
  return raw ? JSON.parse(raw) : { studies: {} };
}

async function writeState(state) {
  await ensureStore();
  await fs.writeFile(demoStorePath, JSON.stringify(state, null, 2), "utf8");
}

function rebuildStatus(study) {
  const currentStatus = study.status ?? {};
  const hasPulmonary = Object.entries(study.pulmonaryForm).some(
    ([key, value]) =>
      !["updatedAt", "updatedBy"].includes(key) && String(value ?? "").trim().length > 0,
  );
  const hasRadiology = Boolean(study.radiologyReport?.radiologicalImpression?.trim());
  const hasAiReport = Boolean(study.aiReport);
  const hasStudyImages = study.studyImages.length > 0;

  const clinicalStatus = hasPulmonary
    ? "complete"
    : normalizeDepartmentStatusValue(currentStatus.clinicalStatus);
  const radiologyStatus = hasRadiology
    ? "complete"
    : normalizeDepartmentStatusValue(currentStatus.radiologyStatus);
  const aiStatus = hasAiReport
    ? "complete"
    : normalizeWorkflowStatusValue(currentStatus.aiStatus);
  const dectrocelStatus = hasAiReport
    ? "complete"
    : normalizeWorkflowStatusValue(currentStatus.dectrocelStatus ?? currentStatus.aiStatus);

  let overallStatus = normalizeWorkflowStatusValue(currentStatus.overallStatus);

  if (clinicalStatus === "complete" && radiologyStatus === "complete" && aiStatus === "complete") {
    overallStatus = "complete";
  } else if (
    hasPulmonary ||
    hasRadiology ||
    hasAiReport ||
    hasStudyImages ||
    clinicalStatus === "complete" ||
    radiologyStatus === "complete" ||
    aiStatus === "in-progress" ||
    aiStatus === "complete" ||
    dectrocelStatus === "in-progress" ||
    dectrocelStatus === "complete"
  ) {
    overallStatus = "in-progress";
  } else {
    overallStatus = "pending";
  }

  study.status = {
    overallStatus,
    clinicalStatus,
    radiologyStatus,
    aiStatus,
    dectrocelStatus,
  };

  return study;
}

function normalizeStoredStudy(study) {
  return rebuildStatus({
    patientProfile: {
      crNo: study?.patientProfile?.crNo ?? "",
      patientName: study?.patientProfile?.patientName ?? "",
      age: study?.patientProfile?.age ?? null,
      gender: study?.patientProfile?.gender ?? null,
      phoneNumber: study?.patientProfile?.phoneNumber ?? null,
    },
    pulmonaryForm: {
      ...emptyPulmonaryForm(),
      ...(study?.pulmonaryForm ?? {}),
      updatedAt: study?.pulmonaryForm?.updatedAt ?? null,
      updatedBy: study?.pulmonaryForm?.updatedBy ?? null,
    },
    radiologyReport: study?.radiologyReport ?? null,
    aiReport: study?.aiReport ?? null,
    studyImages: Array.isArray(study?.studyImages) ? study.studyImages : [],
    status: {
      overallStatus: normalizeWorkflowStatusValue(study?.status?.overallStatus),
      clinicalStatus: normalizeDepartmentStatusValue(study?.status?.clinicalStatus),
      radiologyStatus: normalizeDepartmentStatusValue(study?.status?.radiologyStatus),
      aiStatus: normalizeWorkflowStatusValue(study?.status?.aiStatus),
      dectrocelStatus: normalizeWorkflowStatusValue(study?.status?.dectrocelStatus),
    },
    auditLog: Array.isArray(study?.auditLog) ? study.auditLog : [],
  });
}

function mergeValue(primary, fallback) {
  return hasText(primary) ? primary : fallback ?? primary ?? null;
}

function mergePatientProfile(primary, fallback) {
  return {
    crNo: mergeValue(primary?.crNo, fallback?.crNo) ?? "",
    patientName: mergeValue(primary?.patientName, fallback?.patientName) ?? "",
    age: primary?.age ?? fallback?.age ?? null,
    gender: mergeValue(primary?.gender, fallback?.gender),
    phoneNumber: mergeValue(primary?.phoneNumber, fallback?.phoneNumber),
  };
}

function mergePulmonaryForm(primary, fallback) {
  const merged = {
    ...emptyPulmonaryForm(),
    updatedAt: primary?.updatedAt ?? fallback?.updatedAt ?? null,
    updatedBy: primary?.updatedBy ?? fallback?.updatedBy ?? null,
  };

  Object.keys(emptyPulmonaryForm()).forEach((field) => {
    merged[field] = mergeValue(primary?.[field], fallback?.[field]) ?? "";
  });

  return merged;
}

function mergeFiles(primary, fallback) {
  const seen = new Set();
  const merged = [];

  [...(primary ?? []), ...(fallback ?? [])].forEach((file) => {
    if (!file) {
      return;
    }

    const key = `${file.id ?? ""}::${file.name ?? ""}::${file.url ?? ""}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(file);
  });

  return merged;
}

function mergeAuditLog(primary, fallback) {
  const seen = new Set();
  const merged = [];

  [...(primary ?? []), ...(fallback ?? [])].forEach((entry) => {
    if (!entry) {
      return;
    }

    const key = `${entry.timestamp ?? ""}::${entry.userName ?? ""}::${entry.action ?? ""}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(entry);
  });

  return merged;
}

export function mergeStudyDashboard(primary, fallback) {
  if (!primary && !fallback) {
    return null;
  }

  const normalizedPrimary = primary ? normalizeStoredStudy(primary) : null;
  const normalizedFallback = fallback ? normalizeStoredStudy(fallback) : null;

  if (!normalizedPrimary) {
    return normalizedFallback;
  }

  if (!normalizedFallback) {
    return normalizedPrimary;
  }

  return normalizeStoredStudy({
    patientProfile: mergePatientProfile(
      normalizedPrimary.patientProfile,
      normalizedFallback.patientProfile,
    ),
    pulmonaryForm: mergePulmonaryForm(
      normalizedPrimary.pulmonaryForm,
      normalizedFallback.pulmonaryForm,
    ),
    radiologyReport:
      hasText(normalizedPrimary.radiologyReport?.radiologicalImpression)
        ? normalizedPrimary.radiologyReport
        : normalizedFallback.radiologyReport,
    aiReport: normalizedPrimary.aiReport ?? normalizedFallback.aiReport ?? null,
    studyImages: mergeFiles(normalizedPrimary.studyImages, normalizedFallback.studyImages),
    status: {
      ...normalizedFallback.status,
      ...normalizedPrimary.status,
    },
    auditLog: mergeAuditLog(normalizedPrimary.auditLog, normalizedFallback.auditLog),
  });
}

function serializeFile(file, kind) {
  return {
    id: randomUUID(),
    name: file.originalname,
    url: `data:${file.mimetype || "application/octet-stream"};base64,${file.buffer.toString("base64")}`,
    fileType: kind === "study-image" ? inferStudyFileType(file.originalname, file.mimetype) : null,
    reportType: kind === "pdf" ? "AI_REPORT" : null,
    modality: "CT",
    contentType: file.mimetype || null,
    uploadedAt: new Date().toISOString(),
    kind,
  };
}

function createBaseStudy(payload) {
  return normalizeStoredStudy({
    patientProfile: {
      crNo: payload.crNo,
      patientName: payload.patientName,
      age: payload.age,
      gender: payload.gender,
      phoneNumber: payload.phoneNumber,
    },
    pulmonaryForm: {
      ...emptyPulmonaryForm(),
      updatedAt: null,
      updatedBy: null,
    },
    radiologyReport: null,
    aiReport: null,
    studyImages: payload.files.map((file) => serializeFile(file, "study-image")),
    status: {
      overallStatus: "pending",
      clinicalStatus: "pending",
      radiologyStatus: "pending",
      aiStatus: "pending",
      dectrocelStatus: "pending",
    },
    auditLog: [],
  });
}

async function getStudyRecord(state, crNo) {
  const study = state.studies[crNo];

  if (!study) {
    throw new HttpError(404, `Study ${crNo} was not found in demo mode.`);
  }

  return study;
}

export async function findStoredStudy(crNo) {
  const state = await readState();
  const study = state.studies[crNo];
  return study ? normalizeStoredStudy(clone(study)) : null;
}

export async function listStoredStudySummaries() {
  const state = await readState();

  return Object.values(state.studies)
    .map((study) => normalizeStudySummary(normalizeStoredStudy(clone(study))))
    .sort((left, right) => right.crNo.localeCompare(left.crNo));
}

export async function listDemoStudySummaries() {
  return listStoredStudySummaries();
}

export async function getDemoStudy(crNo) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);
  return normalizeStoredStudy(clone(study));
}

export async function upsertStoredStudy(study) {
  const normalizedStudy = normalizeStoredStudy(study);
  const state = await readState();
  const current = state.studies[normalizedStudy.patientProfile.crNo];

  state.studies[normalizedStudy.patientProfile.crNo] = mergeStudyDashboard(
    normalizedStudy,
    current ? normalizeStoredStudy(current) : null,
  );
  await writeState(state);

  return clone(state.studies[normalizedStudy.patientProfile.crNo]);
}

export async function seedStoredStudy(payload) {
  const draftStudy = createBaseStudy(payload);
  return upsertStoredStudy(draftStudy);
}

export async function createDemoStudy(payload) {
  const state = await readState();

  if (state.studies[payload.crNo]) {
    throw new HttpError(409, `Study ${payload.crNo} already exists.`);
  }

  const study = normalizeStoredStudy(createBaseStudy(payload));
  state.studies[payload.crNo] = study;
  await writeState(state);

  return clone(study);
}

export async function updateDemoPatient(crNo, payload) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.patientProfile = {
    ...study.patientProfile,
    patientName: payload.patientName,
    age: payload.age ?? null,
    gender: payload.gender ?? null,
    phoneNumber: payload.phoneNumber ?? null,
  };

  state.studies[crNo] = normalizeStoredStudy(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function uploadDemoStudyImages(crNo, files) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.studyImages.push(...files.map((file) => serializeFile(file, "study-image")));
  state.studies[crNo] = normalizeStoredStudy(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function saveDemoClinical(crNo, payload, userName) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.pulmonaryForm = {
    ...study.pulmonaryForm,
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
  };

  state.studies[crNo] = normalizeStoredStudy(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function saveDemoRadiology(crNo, reportText, userName) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.radiologyReport = {
    radiologicalImpression: reportText,
    reportedBy: userName,
    reportDate: new Date().toISOString(),
  };

  state.studies[crNo] = normalizeStoredStudy(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function saveDemoAiReport(crNo, file) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.aiReport = serializeFile(file, "pdf");
  state.studies[crNo] = normalizeStoredStudy(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}
