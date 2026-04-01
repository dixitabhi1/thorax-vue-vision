export const DEFAULT_STUDY_WORKSPACE = "ct-thorax";

export const STUDY_WORKSPACES = {
  "ct-thorax": {
    key: "ct-thorax",
    shortLabel: "CT Thorax",
    title: "CT Thorax Study",
    laneLabel: "CT Thorax Lane",
    registerLabel: "Register CT case",
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
    searchPlaceholder: "Search NCG cases by CR number or patient name",
    tableTitle: "NCG workflow table",
    description:
      "Coordinate NCG study cases across pulmonary, radiology, and Dectrocel with the same shared workflow, patient record, and reporting flow.",
  },
};

export function normalizeStudyWorkspace(value) {
  return Object.hasOwn(STUDY_WORKSPACES, value) ? value : DEFAULT_STUDY_WORKSPACE;
}
