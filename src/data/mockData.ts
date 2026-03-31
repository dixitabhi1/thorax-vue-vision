export interface Study {
  id: string;
  crNo: string;
  patientName: string;
  age: number;
  gender: "M" | "F" | "O";
  dateOfStudy: string;
  status: "pending" | "in-progress" | "complete";
  clinicalStatus: "pending" | "complete";
  radiologyStatus: "pending" | "complete";
  aiStatus: "pending" | "processing" | "complete";
  images: string[];
}

export interface ClinicalParameters {
  studyId: string;
  // Presenting Complaints
  cough: string;
  dyspneaGrade: string;
  expectoration: string;
  hemoptysis: boolean;
  chestTightness: boolean;
  // Comorbidities
  t2dm: boolean;
  htn: boolean;
  cad: boolean;
  tb: boolean;
  covid: boolean;
  childhoodPneumonia: boolean;
  // Exposure
  smoking: string;
  exposure: string;
  // Lab Investigations
  hb: number | null;
  tlc: number | null;
  dlcN: number | null;
  dlcL: number | null;
  dlcE: number | null;
  totalIgE: number | null;
  hba1c: number | null;
  // Cardiopulmonary
  pulmHTN: boolean;
  fev1: number | null;
  fvc: number | null;
  fev1FvcRatio: number | null;
  // CT Findings
  emphysema: string;
  bullaeCyst: string;
  nodulesGGO: string;
  mediastinalLN: string;
  pleuralEffusion: boolean;
  pneumothorax: boolean;
  // Additional
  ecg: string;
  ana: string;
  ena: string;
  ra: string;
  msa: string;
  sCalcium: number | null;
  sACE: number | null;
}

export interface RadiologyReport {
  studyId: string;
  findings: string;
  impression: string;
  reportedBy: string;
  reportDate: string;
}

export interface RadiologyAuditEntry {
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
}

export interface AIReport {
  studyId: string;
  pdfFileName: string;
  pdfUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export const MOCK_STUDIES: Study[] = [
  {
    id: "STD-001",
    crNo: "CR-2024-0451",
    patientName: "Rajesh Kumar",
    age: 58,
    gender: "M",
    dateOfStudy: "2024-12-15",
    status: "complete",
    clinicalStatus: "complete",
    radiologyStatus: "complete",
    aiStatus: "complete",
    images: ["/placeholder.svg"],
  },
  {
    id: "STD-002",
    crNo: "CR-2024-0452",
    patientName: "Sunita Devi",
    age: 45,
    gender: "F",
    dateOfStudy: "2024-12-18",
    status: "in-progress",
    clinicalStatus: "complete",
    radiologyStatus: "pending",
    aiStatus: "processing",
    images: ["/placeholder.svg"],
  },
  {
    id: "STD-003",
    crNo: "CR-2024-0453",
    patientName: "Amit Singh",
    age: 62,
    gender: "M",
    dateOfStudy: "2024-12-20",
    status: "in-progress",
    clinicalStatus: "pending",
    radiologyStatus: "pending",
    aiStatus: "pending",
    images: [],
  },
  {
    id: "STD-004",
    crNo: "CR-2024-0454",
    patientName: "Priya Patel",
    age: 39,
    gender: "F",
    dateOfStudy: "2025-01-02",
    status: "pending",
    clinicalStatus: "pending",
    radiologyStatus: "pending",
    aiStatus: "pending",
    images: [],
  },
  {
    id: "STD-005",
    crNo: "CR-2024-0455",
    patientName: "Vikram Tiwari",
    age: 71,
    gender: "M",
    dateOfStudy: "2025-01-05",
    status: "complete",
    clinicalStatus: "complete",
    radiologyStatus: "complete",
    aiStatus: "complete",
    images: ["/placeholder.svg"],
  },
];

export const MOCK_CLINICAL: Record<string, ClinicalParameters> = {
  "STD-001": {
    studyId: "STD-001",
    cough: "Chronic productive cough for 6 months",
    dyspneaGrade: "Grade III",
    expectoration: "Mucoid, moderate amount",
    hemoptysis: false,
    chestTightness: true,
    t2dm: true,
    htn: true,
    cad: false,
    tb: false,
    covid: true,
    childhoodPneumonia: false,
    smoking: "Former smoker (30 pack-years)",
    exposure: "Occupational dust exposure — 15 years in mining",
    hb: 13.2,
    tlc: 9800,
    dlcN: 65,
    dlcL: 28,
    dlcE: 4,
    totalIgE: 185,
    hba1c: 7.1,
    pulmHTN: false,
    fev1: 1.8,
    fvc: 3.2,
    fev1FvcRatio: 56.25,
    emphysema: "Centrilobular + paraseptal, bilateral upper lobes",
    bullaeCyst: "Small subpleural bullae in right apex",
    nodulesGGO: "Scattered GGO in bilateral lower lobes",
    mediastinalLN: "No significant lymphadenopathy",
    pleuralEffusion: false,
    pneumothorax: false,
    ecg: "Normal sinus rhythm, no ST changes",
    ana: "Negative",
    ena: "Negative",
    ra: "Negative",
    msa: "Not done",
    sCalcium: 9.4,
    sACE: 42,
  },
};

export const MOCK_RADIOLOGY: Record<string, RadiologyReport> = {
  "STD-001": {
    studyId: "STD-001",
    findings: "Bilateral upper lobe predominant centrilobular and paraseptal emphysema. Scattered ground glass opacities in lower lobes. No focal consolidation. Trachea and main bronchi patent.",
    impression: "Moderate COPD with emphysematous changes. No evidence of active infection or malignancy.",
    reportedBy: "Dr. Gupta",
    reportDate: "2024-12-16",
  },
};

export const MOCK_RADIOLOGY_AUDIT: Record<string, RadiologyAuditEntry[]> = {
  "STD-001": [
    {
      timestamp: "2024-12-16T10:30:00Z",
      userId: "3",
      userName: "Dr. Gupta",
      action: "Created radiology report",
    },
    {
      timestamp: "2024-12-16T11:15:00Z",
      userId: "3",
      userName: "Dr. Gupta",
      action: "Updated findings and impression",
    },
  ],
};

export const MOCK_AI: Record<string, AIReport> = {
  "STD-001": {
    studyId: "STD-001",
    pdfFileName: "AI_Report_STD-001.pdf",
    pdfUrl: "/placeholder.svg",
    uploadedBy: "Dr. Sharma",
    uploadedAt: "2024-12-16T14:30:00Z",
  },
};
