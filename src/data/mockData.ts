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
  chiefComplaint: string;
  smokingHistory: string;
  packYears: number;
  coughDuration: string;
  dyspneaGrade: string;
  sputumProduction: boolean;
  hemoptysis: boolean;
  weightLoss: boolean;
  fev1: number;
  fvc: number;
  fev1FvcRatio: number;
  spo2: number;
  notes: string;
}

export interface RadiologyReport {
  studyId: string;
  findings: string;
  impression: string;
  emphysemaScore: string;
  airTrapping: string;
  nodules: string;
  bronchiectasis: string;
  consolidation: string;
  pleuralEffusion: boolean;
  lymphadenopathy: boolean;
  reportedBy: string;
  reportDate: string;
}

export interface AIReport {
  studyId: string;
  emphysemaPercentage: number;
  airTrappingPercentage: number;
  lungVolume: number;
  meanLungDensity: number;
  noduleCount: number;
  riskScore: number;
  classification: string;
  generatedAt: string;
  segmentationResults: Record<string, number>;
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
    chiefComplaint: "Chronic cough with breathlessness for 6 months",
    smokingHistory: "Former smoker",
    packYears: 30,
    coughDuration: "6 months",
    dyspneaGrade: "Grade III (mMRC)",
    sputumProduction: true,
    hemoptysis: false,
    weightLoss: true,
    fev1: 1.8,
    fvc: 3.2,
    fev1FvcRatio: 56.25,
    spo2: 92,
    notes: "Patient has history of occupational dust exposure. Family history of COPD.",
  },
};

export const MOCK_RADIOLOGY: Record<string, RadiologyReport> = {
  "STD-001": {
    studyId: "STD-001",
    findings: "Bilateral upper lobe predominant centrilobular and paraseptal emphysema. Scattered ground glass opacities in lower lobes. No focal consolidation. Trachea and main bronchi patent.",
    impression: "Moderate COPD with emphysematous changes. No evidence of active infection or malignancy.",
    emphysemaScore: "Moderate (Grade 3)",
    airTrapping: "Present - predominantly lower lobes",
    nodules: "No suspicious nodules identified",
    bronchiectasis: "Mild cylindrical bronchiectasis in right lower lobe",
    consolidation: "None",
    pleuralEffusion: false,
    lymphadenopathy: false,
    reportedBy: "Dr. Gupta",
    reportDate: "2024-12-16",
  },
};

export const MOCK_AI: Record<string, AIReport> = {
  "STD-001": {
    studyId: "STD-001",
    emphysemaPercentage: 24.5,
    airTrappingPercentage: 18.3,
    lungVolume: 5.8,
    meanLungDensity: -856,
    noduleCount: 0,
    riskScore: 6.2,
    classification: "Moderate COPD - GOLD Stage II",
    generatedAt: "2024-12-16T14:30:00Z",
    segmentationResults: {
      "Right Upper Lobe": 28.1,
      "Right Middle Lobe": 12.4,
      "Right Lower Lobe": 19.7,
      "Left Upper Lobe": 31.2,
      "Left Lower Lobe": 16.8,
    },
  },
};
