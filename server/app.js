import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { distDir } from "./config.js";
import { appendRadiologyAuditEntry, getRadiologyAuditEntries } from "./lib/audit-store.js";
import { findDemoUser, issueDemoToken, normalizeRole, parseDemoToken } from "./lib/demo-auth.js";
import {
  createDemoStudy,
  getDemoStudy,
  listDemoStudySummaries,
  saveDemoAiReport,
  saveDemoClinical,
  saveDemoRadiology,
  updateDemoPatient,
  uploadDemoStudyImages,
} from "./lib/demo-store.js";
import { requestExternal, requestExternalSafely, uploadExternalFile } from "./lib/external-api.js";
import { HttpError, isHttpError } from "./lib/http-error.js";
import {
  PULMONARY_FIELDS,
  appendRadiologistSignature,
  inferStudyFileType,
  isPdfFile,
  normalizeDashboardResponse,
  normalizeStudySummary,
  sanitizePulmonaryPayload,
} from "./lib/normalize.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const createStudySchema = z.object({
  crNo: z.string().trim().min(1, "CR number is required."),
  patientName: z.string().trim().min(1, "Patient name is required."),
  age: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .refine((value) => value === null || Number.isInteger(value), "Age must be a whole number."),
  gender: z.string().trim().optional().transform((value) => value || null),
  phoneNumber: z.string().trim().optional().transform((value) => value || null),
  modality: z.string().trim().optional().transform((value) => value || "CT"),
});

const updatePatientSchema = z.object({
  patientName: z.string().trim().min(1, "Patient name is required."),
  age: z.number().int().nullable().optional(),
  gender: z.string().trim().nullable().optional(),
  phoneNumber: z.string().trim().nullable().optional(),
});

const radiologySchema = z.object({
  radiologicalImpression: z.string().trim().min(1, "Radiology report is required."),
  radiologistName: z.string().trim().optional(),
});

const pulmonarySchema = z.object(
  Object.fromEntries(
    PULMONARY_FIELDS.map((field) => [
      field,
      z.union([z.string(), z.null()]).optional(),
    ]),
  ),
);

function readAuthToken(request) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

function requireAuthToken(request) {
  const token = readAuthToken(request);

  if (!token) {
    throw new HttpError(401, "Sign in is required before calling this endpoint.");
  }

  return token;
}

async function fetchCurrentUser(token) {
  return requestExternal({
    pathname: "/auth/me",
    token,
  });
}

async function setDepartmentStatus({ token, crNo, department, status }) {
  const pathname = `/${department}/status/${encodeURIComponent(crNo)}`;

  return requestExternal({
    pathname,
    method: "PUT",
    token,
    body: { status },
  });
}

async function fetchStudyDashboard(token, crNo) {
  const [dashboardPayload, filesPayload, auditLog] = await Promise.all([
    requestExternalSafely(
      {
        pathname: `/patients/${encodeURIComponent(crNo)}/dashboard`,
        token,
      },
      {
        patient_profile: null,
        pulmonary: [],
        radiology: [],
        pdf_reports: [],
        study_images: [],
        status: null,
      },
    ),
    requestExternalSafely(
      {
        pathname: `/dectrocel/${encodeURIComponent(crNo)}/files`,
        token,
      },
      [],
    ),
    getRadiologyAuditEntries(crNo),
  ]);

  if (!dashboardPayload?.patient_profile) {
    dashboardPayload.patient_profile = await requestExternal({
      pathname: `/patients/${encodeURIComponent(crNo)}`,
      token,
    });
  }

  if (!dashboardPayload?.status) {
    dashboardPayload.status = await requestExternalSafely(
      {
        pathname: `/status/${encodeURIComponent(crNo)}`,
        token,
      },
      null,
    );
  }

  return normalizeDashboardResponse({
    crNo,
    dashboardPayload,
    filesPayload,
    auditLog,
  });
}

function normalizeUserPayload(rawUser, fallback = {}) {
  return {
    username: rawUser?.username ?? fallback.username ?? "",
    fullName: rawUser?.full_name ?? rawUser?.fullName ?? fallback.fullName ?? "",
    role: normalizeRole(rawUser?.role ?? fallback.role ?? ""),
  };
}

function requireSession(request) {
  const token = requireAuthToken(request);
  const demoUser = parseDemoToken(token);

  if (demoUser) {
    return {
      kind: "demo",
      user: demoUser,
      token,
    };
  }

  return {
    kind: "external",
    token,
  };
}

async function resolveCurrentUser(session, fallback = {}) {
  if (session.kind === "demo") {
    return normalizeUserPayload(session.user, fallback);
  }

  return normalizeUserPayload(await fetchCurrentUser(session.token), fallback);
}

async function getDemoStudyDashboard(crNo) {
  const [dashboard, auditLog] = await Promise.all([
    getDemoStudy(crNo),
    getRadiologyAuditEntries(crNo),
  ]);

  return {
    ...dashboard,
    auditLog,
  };
}

export function createApp() {
  const app = express();
  const hasDistBundle = existsSync(distDir);

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/auth/login", async (request, response) => {
    const credentials = z
      .object({
        username: z.string().trim().min(1, "Username is required."),
        password: z.string().trim().min(1, "Password is required."),
      })
      .parse(request.body);

    try {
      const session = await requestExternal({
        pathname: "/auth/login",
        method: "POST",
        body: credentials,
      });

      response.json({
        accessToken: session.access_token,
        tokenType: session.token_type,
        role: normalizeRole(session.role),
        fullName: session.full_name,
        username: credentials.username,
      });
      return;
    } catch (error) {
      const demoUser = findDemoUser(credentials.username, credentials.password);

      if (demoUser && isHttpError(error) && error.status >= 500) {
        response.json({
          accessToken: issueDemoToken(demoUser),
          tokenType: "bearer",
          role: demoUser.role,
          fullName: demoUser.fullName,
          username: demoUser.username,
          demoMode: true,
        });
        return;
      }

      throw error;
    }
  });

  app.get("/api/auth/me", async (request, response) => {
    const session = requireSession(request);
    const profile = await resolveCurrentUser(session);
    response.json(profile);
  });

  app.get("/api/studies", async (request, response) => {
    const session = requireSession(request);

    if (session.kind === "demo") {
      response.json(await listDemoStudySummaries());
      return;
    }

    const token = session.token;
    const patients = await requestExternal({
      pathname: "/patients",
      token,
    });

    const dashboards = await Promise.all(
      patients.map((patient) => fetchStudyDashboard(token, patient.cr_no)),
    );

    response.json(
      dashboards
        .map(normalizeStudySummary)
        .sort((left, right) => right.crNo.localeCompare(left.crNo)),
    );
  });

  app.post("/api/studies", upload.array("files"), async (request, response) => {
    const session = requireSession(request);
    const payload = createStudySchema.parse(request.body);
    const files = Array.isArray(request.files) ? request.files : [];

    if (session.kind === "demo") {
      const dashboard = await createDemoStudy({
        ...payload,
        files,
      });
      response.status(201).json(dashboard);
      return;
    }

    const token = session.token;

    await requestExternal({
      pathname: "/patients",
      method: "POST",
      token,
      body: {
        cr_no: payload.crNo,
        patient_name: payload.patientName,
        age: payload.age,
        gender: payload.gender,
        phone_number: payload.phoneNumber,
      },
    });

    await Promise.all([
      setDepartmentStatus({
        token,
        crNo: payload.crNo,
        department: "pulmonary",
        status: "PENDING",
      }),
      setDepartmentStatus({
        token,
        crNo: payload.crNo,
        department: "radiology",
        status: "PENDING",
      }),
      setDepartmentStatus({
        token,
        crNo: payload.crNo,
        department: "dectrocel",
        status: "PENDING",
      }),
    ]);

    await Promise.all(
      files.map((file) =>
        uploadExternalFile({
          pathname: `/dectrocel/${encodeURIComponent(payload.crNo)}/upload-study-image`,
          token,
          file,
          fields: {
            modality: payload.modality,
            file_type: inferStudyFileType(file.originalname, file.mimetype),
          },
        }),
      ),
    );

    const dashboard = await fetchStudyDashboard(token, payload.crNo);
    response.status(201).json(dashboard);
  });

  app.get("/api/studies/:crNo", async (request, response) => {
    const session = requireSession(request);

    if (session.kind === "demo") {
      response.json(await getDemoStudyDashboard(request.params.crNo));
      return;
    }

    const token = session.token;
    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json(dashboard);
  });

  app.put("/api/studies/:crNo/patient", async (request, response) => {
    const session = requireSession(request);
    const payload = updatePatientSchema.parse(request.body);

    if (session.kind === "demo") {
      response.json(await updateDemoPatient(request.params.crNo, payload));
      return;
    }

    const token = session.token;

    await requestExternal({
      pathname: `/patients/${encodeURIComponent(request.params.crNo)}`,
      method: "PUT",
      token,
      body: {
        patient_name: payload.patientName,
        age: payload.age ?? null,
        gender: payload.gender ?? null,
        phone_number: payload.phoneNumber ?? null,
      },
    });

    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json(dashboard);
  });

  app.post("/api/studies/:crNo/images", upload.array("files"), async (request, response) => {
    const session = requireSession(request);
    const files = Array.isArray(request.files) ? request.files : [];

    if (!files.length) {
      throw new HttpError(400, "Upload at least one study file.");
    }

    if (session.kind === "demo") {
      response.json(await uploadDemoStudyImages(request.params.crNo, files));
      return;
    }

    const token = session.token;

    await Promise.all(
      files.map((file) =>
        uploadExternalFile({
          pathname: `/dectrocel/${encodeURIComponent(request.params.crNo)}/upload-study-image`,
          token,
          file,
          fields: {
            modality: "CT",
            file_type: inferStudyFileType(file.originalname, file.mimetype),
          },
        }),
      ),
    );

    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json(dashboard);
  });

  app.put("/api/studies/:crNo/clinical", async (request, response) => {
    const session = requireSession(request);
    pulmonarySchema.parse(request.body);

    const payload = sanitizePulmonaryPayload(request.body);

    if (session.kind === "demo") {
      const currentUser = await resolveCurrentUser(session);
      response.json(await saveDemoClinical(request.params.crNo, payload, currentUser.fullName));
      return;
    }

    const token = session.token;

    await requestExternal({
      pathname: `/pulmonary/${encodeURIComponent(request.params.crNo)}`,
      method: "POST",
      token,
      body: payload,
    });

    await setDepartmentStatus({
      token,
      crNo: request.params.crNo,
      department: "pulmonary",
      status: "COMPLETED",
    });

    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json(dashboard);
  });

  app.put("/api/studies/:crNo/radiology", async (request, response) => {
    const session = requireSession(request);
    const payload = radiologySchema.parse(request.body);
    const currentUser = await resolveCurrentUser(session, {
      fullName: payload.radiologistName,
    });
    const signedReport = appendRadiologistSignature(
      payload.radiologicalImpression,
      currentUser.fullName,
    );

    if (session.kind === "demo") {
      const existingStudy = await getDemoStudy(request.params.crNo);
      const auditLog = await appendRadiologyAuditEntry(request.params.crNo, {
        timestamp: new Date().toISOString(),
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: existingStudy.radiologyReport ? "Updated radiology report" : "Created radiology report",
      });

      const dashboard = await saveDemoRadiology(
        request.params.crNo,
        signedReport,
        currentUser.fullName,
      );

      response.json({
        ...dashboard,
        auditLog,
      });
      return;
    }

    const token = session.token;

    const existingReports = await requestExternalSafely(
      {
        pathname: `/radiology/${encodeURIComponent(request.params.crNo)}`,
        token,
      },
      [],
    );

    const auditLog = await appendRadiologyAuditEntry(request.params.crNo, {
      timestamp: new Date().toISOString(),
      userName: currentUser.fullName,
      userRole: currentUser.role,
      action: asList(existingReports).length > 0 ? "Updated radiology report" : "Created radiology report",
    });

    await requestExternal({
      pathname: `/radiology/${encodeURIComponent(request.params.crNo)}`,
      method: "POST",
      token,
      body: {
        radiological_impression: signedReport,
      },
    });

    await setDepartmentStatus({
      token,
      crNo: request.params.crNo,
      department: "radiology",
      status: "COMPLETED",
    });

    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json({
      ...dashboard,
      auditLog,
    });
  });

  app.post("/api/studies/:crNo/ai-report", upload.single("file"), async (request, response) => {
    const session = requireSession(request);
    const file = request.file;

    if (!file) {
      throw new HttpError(400, "Select a PDF report to upload.");
    }

    if (!isPdfFile(file)) {
      throw new HttpError(400, "AI reports must be uploaded as PDF files only.");
    }

    if (session.kind === "demo") {
      response.json(await saveDemoAiReport(request.params.crNo, file));
      return;
    }

    const token = session.token;

    await uploadExternalFile({
      pathname: `/dectrocel/${encodeURIComponent(request.params.crNo)}/upload-ai-report`,
      token,
      file,
      fields: {
        modality: "CT",
        report_type: "AI_REPORT",
      },
    });

    await setDepartmentStatus({
      token,
      crNo: request.params.crNo,
      department: "dectrocel",
      status: "COMPLETED",
    });

    const dashboard = await fetchStudyDashboard(token, request.params.crNo);
    response.json(dashboard);
  });

  if (hasDistBundle) {
    app.use(express.static(distDir));

    app.get("/{*splat}", (request, response, next) => {
      if (request.path.startsWith("/api")) {
        next();
        return;
      }

      response.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.use((error, _request, response, _next) => {
    const isValidationError = error instanceof z.ZodError;
    const status = isValidationError ? 400 : isHttpError(error) ? error.status : 500;
    const message = isValidationError
      ? error.issues[0]?.message ?? "Invalid request."
      : error.message ?? "Unexpected server error.";

    if (status >= 500) {
      console.error(error);
    }

    response.status(status).json({
      message,
      details: isHttpError(error) ? error.details : undefined,
    });
  });

  return app;
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}
