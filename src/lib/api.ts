export type UserRole = "ADMIN" | "DECTROCEL" | "RADIOLOGY" | "PULMONARY";
export type WorkflowStatus = "pending" | "in-progress" | "complete";
export type DepartmentStatus = "pending" | "complete";

export const SESSION_STORAGE_KEY = "thorax_session";

export const PULMONARY_FIELD_KEYS = [
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
] as const;

export type PulmonaryFieldKey = (typeof PULMONARY_FIELD_KEYS)[number];

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  role: UserRole;
  fullName: string;
  username: string;
}

export interface StudySummary {
  crNo: string;
  patientName: string;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
  status: WorkflowStatus;
  clinicalStatus: DepartmentStatus;
  radiologyStatus: DepartmentStatus;
  aiStatus: WorkflowStatus | DepartmentStatus;
  studyImageCount: number;
  aiReportCount: number;
}

export interface PatientProfile {
  crNo: string;
  patientName: string;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
}

export interface StudyFile {
  id: string;
  name: string;
  url: string | null;
  fileType: string | null;
  reportType: string | null;
  modality: string | null;
  contentType: string | null;
  uploadedAt: string | null;
  kind: "pdf" | "study-image" | null;
}

export type PulmonaryFormValues = Record<PulmonaryFieldKey, string> & {
  updatedAt: string | null;
  updatedBy: string | null;
};

export interface RadiologyReportData {
  radiologicalImpression: string;
  reportedBy: string | null;
  reportDate: string | null;
}

export interface RadiologyAuditEntry {
  timestamp: string;
  userName: string;
  userRole: UserRole | string;
  action: string;
}

export interface StudyDashboard {
  patientProfile: PatientProfile;
  pulmonaryForm: PulmonaryFormValues;
  radiologyReport: RadiologyReportData | null;
  aiReport: StudyFile | null;
  studyImages: StudyFile[];
  status: {
    overallStatus: WorkflowStatus;
    clinicalStatus: DepartmentStatus;
    radiologyStatus: DepartmentStatus;
    aiStatus: WorkflowStatus | DepartmentStatus;
    dectrocelStatus: WorkflowStatus | DepartmentStatus;
  };
  auditLog: RadiologyAuditEntry[];
}

export interface CreateStudyInput {
  crNo: string;
  patientName: string;
  age: number | null;
  gender: string;
  phoneNumber: string;
  files: File[];
}

export interface UpdatePatientProfileInput {
  patientName: string;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
}

export interface UpdateRadiologyInput {
  radiologicalImpression: string;
  radiologistName: string;
}

interface ApiRequestOptions {
  method?: string;
  body?: BodyInit | object | null;
  token?: string;
}

function createEmptyPulmonaryForm(): PulmonaryFormValues {
  return {
    ...Object.fromEntries(PULMONARY_FIELD_KEYS.map((field) => [field, ""])),
    updatedAt: null,
    updatedBy: null,
  } as PulmonaryFormValues;
}

export function loadStoredSession(): AuthSession | null {
  const rawValue = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function saveStoredSession(session: AuthSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const storedSession = loadStoredSession();
  const headers = new Headers();
  const token = options.token ?? storedSession?.accessToken;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body instanceof FormData) {
    requestInit.body = options.body;
  } else if (options.body !== undefined && options.body !== null) {
    headers.set("Content-Type", "application/json");
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestInit);
  const payload = await parseApiResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.detail || "Request failed.";

    throw new Error(message);
  }

  return payload as T;
}

export function createMultipartForm(files: File[], extraFields: Record<string, string>) {
  const formData = new FormData();

  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  files.forEach((file) => {
    formData.append("files", file);
  });

  return formData;
}

export const api = {
  login(username: string, password: string) {
    return apiRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
  },

  me() {
    return apiRequest<{ username: string; fullName: string; role: UserRole }>("/api/auth/me");
  },

  listStudies() {
    return apiRequest<StudySummary[]>("/api/studies");
  },

  getStudy(crNo: string) {
    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}`);
  },

  createStudy(input: CreateStudyInput) {
    const formData = createMultipartForm(input.files, {
      crNo: input.crNo,
      patientName: input.patientName,
      age: input.age === null ? "" : String(input.age),
      gender: input.gender,
      phoneNumber: input.phoneNumber,
      modality: "CT",
    });

    return apiRequest<StudyDashboard>("/api/studies", {
      method: "POST",
      body: formData,
    });
  },

  updatePatient(crNo: string, input: UpdatePatientProfileInput) {
    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}/patient`, {
      method: "PUT",
      body: input,
    });
  },

  uploadStudyImages(crNo: string, files: File[]) {
    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}/images`, {
      method: "POST",
      body: createMultipartForm(files, {}),
    });
  },

  saveClinical(crNo: string, formValues: Partial<Record<PulmonaryFieldKey, string>>) {
    const payload = Object.fromEntries(
      PULMONARY_FIELD_KEYS.map((field) => [field, formValues[field] ?? ""]),
    );

    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}/clinical`, {
      method: "PUT",
      body: payload,
    });
  },

  saveRadiology(crNo: string, input: UpdateRadiologyInput) {
    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}/radiology`, {
      method: "PUT",
      body: input,
    });
  },

  uploadAiReport(crNo: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<StudyDashboard>(`/api/studies/${encodeURIComponent(crNo)}/ai-report`, {
      method: "POST",
      body: formData,
    });
  },
};

export { createEmptyPulmonaryForm };
