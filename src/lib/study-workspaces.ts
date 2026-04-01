export type StudyWorkspace = "ct-thorax" | "ncg";

export const DEFAULT_STUDY_WORKSPACE: StudyWorkspace = "ct-thorax";

export const STUDY_WORKSPACES: Record<
  StudyWorkspace,
  {
    key: StudyWorkspace;
    shortLabel: string;
    title: string;
    laneLabel: string;
    registerLabel: string;
    registerTitle: string;
    searchPlaceholder: string;
    tableTitle: string;
    description: string;
  }
> = {
  "ct-thorax": {
    key: "ct-thorax",
    shortLabel: "CT Thorax",
    title: "CT Thorax Study",
    laneLabel: "CT Thorax Lane",
    registerLabel: "Register CT case",
    registerTitle: "Register CT thorax case",
    searchPlaceholder: "Search CT thorax cases by CR number or patient name",
    tableTitle: "CT thorax workflow table",
    description:
      "Coordinate CT thorax cases across pulmonary, radiology, and Dectrocel while each department keeps the same cr_no-linked record in sync.",
  },
  ncg: {
    key: "ncg",
    shortLabel: "NCG",
    title: "NCG Study",
    laneLabel: "NCG Lane",
    registerLabel: "Register NCG case",
    registerTitle: "Register NCG case",
    searchPlaceholder: "Search NCG cases by CR number or patient name",
    tableTitle: "NCG workflow table",
    description:
      "Coordinate NCG study cases across pulmonary, radiology, and Dectrocel with the same shared workflow, patient record, and reporting flow.",
  },
};

export function normalizeStudyWorkspace(value?: string | null): StudyWorkspace {
  return value === "ncg" ? "ncg" : DEFAULT_STUDY_WORKSPACE;
}
