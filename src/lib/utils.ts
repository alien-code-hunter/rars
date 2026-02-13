import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { STATUS_CONFIG, type ApplicationStatus, type UserRole } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatStatusLabel(status: ApplicationStatus) {
  return STATUS_CONFIG[status]?.label ?? status;
}

export function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleLabel(roles: UserRole[]) {
  if (roles.includes("SYSTEM_ADMIN")) return "System Admin";
  if (roles.includes("EXECUTIVE_DIRECTOR")) return "Executive Director";
  if (roles.includes("ADMIN_OFFICER")) return "Admin Officer";
  if (roles.includes("REVIEWER")) return "Reviewer";
  return "Applicant";
}
