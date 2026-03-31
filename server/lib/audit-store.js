import fs from "node:fs/promises";
import path from "node:path";
import { auditLogPath } from "../config.js";

async function ensureAuditFile() {
  await fs.mkdir(path.dirname(auditLogPath), { recursive: true });

  try {
    await fs.access(auditLogPath);
  } catch {
    await fs.writeFile(auditLogPath, JSON.stringify({}, null, 2), "utf8");
  }
}

async function readAuditState() {
  await ensureAuditFile();
  const raw = await fs.readFile(auditLogPath, "utf8");
  return raw ? JSON.parse(raw) : {};
}

async function writeAuditState(state) {
  await ensureAuditFile();
  await fs.writeFile(auditLogPath, JSON.stringify(state, null, 2), "utf8");
}

export async function getRadiologyAuditEntries(crNo) {
  const state = await readAuditState();
  return state[crNo] ?? [];
}

export async function appendRadiologyAuditEntry(crNo, entry) {
  const state = await readAuditState();
  const current = state[crNo] ?? [];
  current.push(entry);
  state[crNo] = current;
  await writeAuditState(state);
  return current;
}
