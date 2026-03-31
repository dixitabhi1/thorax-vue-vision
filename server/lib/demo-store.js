import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoStorePath } from "../config.js";
import { HttpError } from "./http-error.js";
import { emptyPulmonaryForm, inferStudyFileType, normalizeStudySummary } from "./normalize.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
  const hasPulmonary = Object.entries(study.pulmonaryForm).some(
    ([key, value]) =>
      !["updatedAt", "updatedBy"].includes(key) && String(value ?? "").trim().length > 0,
  );
  const hasRadiology = Boolean(study.radiologyReport?.radiologicalImpression?.trim());
  const hasAiReport = Boolean(study.aiReport);
  const hasStudyImages = study.studyImages.length > 0;

  let overallStatus = "pending";

  if (hasPulmonary && hasRadiology && hasAiReport) {
    overallStatus = "complete";
  } else if (hasPulmonary || hasRadiology || hasAiReport || hasStudyImages) {
    overallStatus = "in-progress";
  }

  study.status = {
    overallStatus,
    clinicalStatus: hasPulmonary ? "complete" : "pending",
    radiologyStatus: hasRadiology ? "complete" : "pending",
    aiStatus: hasAiReport ? "complete" : "pending",
    dectrocelStatus: hasAiReport ? "complete" : "pending",
  };

  return study;
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
  return rebuildStatus({
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

export async function listDemoStudySummaries() {
  const state = await readState();

  return Object.values(state.studies)
    .map((study) => normalizeStudySummary(rebuildStatus(clone(study))))
    .sort((left, right) => right.crNo.localeCompare(left.crNo));
}

export async function getDemoStudy(crNo) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);
  return rebuildStatus(clone(study));
}

export async function createDemoStudy(payload) {
  const state = await readState();

  if (state.studies[payload.crNo]) {
    throw new HttpError(409, `Study ${payload.crNo} already exists.`);
  }

  const study = createBaseStudy(payload);
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

  state.studies[crNo] = rebuildStatus(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function uploadDemoStudyImages(crNo, files) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.studyImages.push(...files.map((file) => serializeFile(file, "study-image")));
  state.studies[crNo] = rebuildStatus(study);
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

  state.studies[crNo] = rebuildStatus(study);
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

  state.studies[crNo] = rebuildStatus(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}

export async function saveDemoAiReport(crNo, file) {
  const state = await readState();
  const study = await getStudyRecord(state, crNo);

  study.aiReport = serializeFile(file, "pdf");
  state.studies[crNo] = rebuildStatus(study);
  await writeState(state);

  return clone(state.studies[crNo]);
}
