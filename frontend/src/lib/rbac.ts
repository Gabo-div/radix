import type { Role } from "../types";

export function canUpload(role: Role) {
  return role === "admin";
}

export function canCreateCourse(role: Role) {
  return role === "admin";
}

export function canCreateQuiz(role: Role) {
  return role === "admin";
}

export function canTakeQuiz(role: Role) {
  return role === "student";
}

export function canSeeMonitor(role: Role) {
  return role === "admin";
}

export function canSeeDashboard(role: Role) {
  return role === "student";
}

export function canSeeQuiz(role: Role): boolean {
  return role === "student" || role === "admin";
}

export function canEdit(role: Role): boolean {
  return role === "admin";
}

export function getSidebarItems(role: Role) {
  const items: { label: string; path: string; icon: string }[] = [];
  if (role === "student") items.push({ label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" });
  items.push({ label: "Cursos", path: "/courses", icon: "BookOpen" });
  if (role === "admin" || role === "student" || role === "guest") items.push({ label: "Biblioteca", path: "/library", icon: "Library" });
  if (role === "admin") {
    items.push({ label: "Panel Admin", path: "/admin", icon: "Settings" });
    items.push({ label: "Monitor", path: "/admin/monitor", icon: "Monitor" });
    items.push({ label: "Logs", path: "/admin/logs", icon: "ScrollText" });
  }
  return items;
}

export function getRedirectPath(role: Role): string {
  switch (role) {
    case "admin": return "/courses";
    case "student": return "/dashboard";
    case "guest": return "/courses";
  }
}

export const roleLabels: Record<Role, string> = {
  admin: "Profesor",
  student: "Estudiante",
  guest: "Invitado",
};

export const roleColors: Record<Role, string> = {
  admin: "text-emerald-400",
  student: "text-indigo-400",
  guest: "text-amber-400",
};
