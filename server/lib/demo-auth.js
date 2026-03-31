const DEMO_USERS = [
  {
    username: "admin1",
    password: "admin123",
    role: "ADMIN",
    fullName: "Dectrocel Admin",
    departmentName: "Dectrocel",
  },
  {
    username: "radio1",
    password: "radio123",
    role: "RADIOLOGY",
    fullName: "Dr. Radiology User",
    departmentName: "Radiodiagnosis",
  },
  {
    username: "pulmo1",
    password: "pulmo123",
    role: "PULMONARY",
    fullName: "Dr. Pulmonary User",
    departmentName: "Pulmonary",
  },
];

export function normalizeRole(role) {
  const normalizedRole = String(role ?? "").trim().toUpperCase();

  if (normalizedRole === "SUPER_ADMIN") {
    return "ADMIN";
  }

  return normalizedRole;
}

export function findDemoUser(username, password) {
  return (
    DEMO_USERS.find((user) => user.username === username && user.password === password) ??
    null
  );
}

export function issueDemoToken(user) {
  return `demo.${Buffer.from(
    JSON.stringify({
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      departmentName: user.departmentName,
    }),
  ).toString("base64url")}`;
}

export function parseDemoToken(token) {
  if (!token?.startsWith("demo.")) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.slice("demo.".length), "base64url").toString("utf8"));
    return {
      username: payload.username,
      role: normalizeRole(payload.role),
      fullName: payload.fullName,
      departmentName: payload.departmentName,
    };
  } catch {
    return null;
  }
}
