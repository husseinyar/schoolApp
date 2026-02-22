
import { Role } from "@prisma/client";

export type Permission =
    | "view:dashboard"
    | "manage:users"
    | "manage:routes"
    | "view:routes"
    | "manage:students"
    | "view:students";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    ADMIN: [
        "view:dashboard",
        "manage:users",
        "manage:routes",
        "view:routes",
        "manage:students",
        "view:students",
    ],
    DRIVER: [
        "view:routes",
        "view:students", // Only for their route
    ],
    PARENT: [
        "view:students", // Only their children
    ],
    STUDENT: [
        "view:routes", // Only their route
    ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole);
}
