import type { AppRole, CurrentUser } from "@/types";

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === "admin";
}

export function isPlayer(user: CurrentUser | null): boolean {
  return user?.role === "player" || user?.role === "admin";
}

export function hasRole(user: CurrentUser | null, role: AppRole): boolean {
  if (role === "player") return isPlayer(user);
  if (role === "admin") return isAdmin(user);
  return false;
}
