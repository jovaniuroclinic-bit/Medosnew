export const ROLES = [
  "OWNER",
  "CLINICAL_ASSISTANT",
  "LEGAL_DOCUMENT_ASSISTANT",
  "ACCOUNTING_ASSISTANT",
  "RESEARCH_ASSISTANT",
  "COMMUNICATION_ASSISTANT",
  "PROJECT_MANAGER",
  "SOCIAL_MEDIA_ASSISTANT",
  "SECURITY_ANALYST",
  "FORENSIC_ASSISTANT",
  "READ_ONLY_AUDITOR",
] as const;

export type Role = (typeof ROLES)[number];
export type Permission =
  | "read"
  | "manage_projects"
  | "quarantine_files"
  | "connect_accounts"
  | "publish"
  | "send_messages"
  | "approve_records"
  | "deploy"
  | "modify_dns"
  | "rotate_credentials"
  | "export_evidence"
  | "restore_backups"
  | "delete_information";

const ownerOnly = new Set<Permission>([
  "connect_accounts", "publish", "send_messages", "approve_records", "deploy",
  "modify_dns", "rotate_credentials", "export_evidence", "restore_backups",
  "delete_information",
]);

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "OWNER") return true;
  if (ownerOnly.has(permission)) return false;
  if (permission === "read") return true;
  if (permission === "manage_projects") return role === "PROJECT_MANAGER";
  if (permission === "quarantine_files") return role === "SECURITY_ANALYST" || role === "FORENSIC_ASSISTANT";
  return false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new Error("Permiso denegado");
}
