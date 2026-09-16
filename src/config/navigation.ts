import {
  Users,
  UserCog,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/types/permission";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Route gate. Absent = always visible (Settings). */
  permission?: PermissionKey;
}

/** Single source of truth for sidebar + landing redirect. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/users", label: "Users", icon: Users, permission: "users.read" },
  { to: "/roles", label: "Roles", icon: UserCog, permission: "roles.read" },
  {
    to: "/permissions",
    label: "Permissions",
    icon: ShieldCheck,
    permission: "permissions.read",
  },
  { to: "/settings/password", label: "Settings", icon: Settings },
];

/**
 * First sidebar destination the caller can actually open. Falls back to
 * Settings (ungated) so a low-permission user never lands in a redirect loop.
 */
export function firstAllowedPath(
  hasPermission: (name: PermissionKey) => boolean,
): string {
  for (const item of NAV_ITEMS) {
    if (!item.permission || hasPermission(item.permission)) return item.to;
  }
  return "/settings/password";
}
