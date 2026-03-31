import { externalApiBaseUrl, externalApiKey } from "../config.js";
import { HttpError } from "./http-error.js";

function ensureApiKey() {
  if (!externalApiKey) {
    throw new HttpError(
      500,
      "The backend proxy is missing EXTERNAL_API_KEY. Add it to a local .env file before starting the server.",
    );
  }
}

function buildUrl(pathname) {
  return `${externalApiBaseUrl}${pathname}`;
}

function extractErrorMessage(payload, fallbackStatus) {
  if (!payload) {
    return `External API request failed with status ${fallbackStatus}.`;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return payload.message || payload.detail || payload.error || `External API request failed with status ${fallbackStatus}.`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawText);
    } catch {
      return rawText;
    }
  }

  return rawText;
}

export async function requestExternal({
  pathname,
  method = "GET",
  token,
  body,
  headers = {},
}) {
  ensureApiKey();

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("x-api-key", externalApiKey);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestInit = {
    method,
    headers: requestHeaders,
  };

  if (body instanceof FormData) {
    requestInit.body = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(pathname), requestInit);
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(response.status, extractErrorMessage(payload, response.status), payload);
  }

  return payload;
}

export async function requestExternalSafely(options, fallbackValue) {
  try {
    return await requestExternal(options);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return fallbackValue;
    }

    throw error;
  }
}

export async function uploadExternalFile({
  pathname,
  token,
  file,
  fields,
}) {
  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    form.append(key, value);
  });

  const blob = new Blob([file.buffer], {
    type: file.mimetype || "application/octet-stream",
  });

  form.append("file", blob, file.originalname);

  return requestExternal({
    pathname,
    method: "POST",
    token,
    body: form,
  });
}
