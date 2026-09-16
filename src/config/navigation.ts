import {
  Users,
  UserCog,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Route gate. Absent = always visible (Settings). */
  permission?: string;
}

/** Single source of truth for sidebar + landing redirect. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/users", label: "Users", icon: Users, permission: "users.list" },
  { to: "/roles", label: "Roles", icon: UserCog, permission: "roles.list" },
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
  hasPermission: (name: string) => boolean,
): string {
  for (const item of NAV_ITEMS) {
    if (!item.permission || hasPermission(item.permission)) return item.to;
  }
  return "/settings/password";
}
