import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..");
export const distDir = path.join(projectRoot, "dist");
export const port = Number(process.env.PORT ?? 3001);
export const externalApiBaseUrl = (process.env.EXTERNAL_API_BASE_URL ?? "http://54.252.216.233:8042").replace(/\/+$/, "");
export const externalApiKey = process.env.EXTERNAL_API_KEY ?? "";
export const auditLogPath =
  process.env.RADIOLOGY_AUDIT_LOG_PATH ??
  path.join(projectRoot, "server", "data", "radiology-audit.json");
