
import { Role } from "@prisma/client";
import {
    LayoutDashboard,
    Users,
    School,
    Bus,
    FileText,
    Settings,
    Map,
    Bell,
    GraduationCap,
    Shield,
    CalendarX,
    Phone,
    ClipboardList,
    MapPin
} from "lucide-react";

export interface NavItem {
    title: string;
    href: string;
    icon: any; // Lucide icon type
    roles: Role[];
    children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "DRIVER", "PARENT", "STUDENT"],
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        roles: ["ADMIN"],
    },
    {
        title: "Schools",
        href: "/admin/schools",
        icon: School,
        roles: ["ADMIN"],
    },
    {
        title: "Routes",
        href: "/admin/routes",
        icon: Bus,
        roles: ["ADMIN", "DRIVER"],
    },
    {
        title: "Audit Logs",
        href: "/admin/audit",
        icon: FileText,
        roles: ["ADMIN"],
    },
    {
        title: "Students",
        href: "/admin/students",
        icon: GraduationCap,
        roles: ["ADMIN"],
    },
    {
        title: "Live Map",
        href: "/admin/map",
        icon: Map,
        roles: ["ADMIN", "DRIVER"],
    },
    {
        title: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        roles: ["ADMIN"],
    },
    // ── Driver Portal ──────────────────────────────────────────
    {
        title: "Home",
        href: "/driver",
        icon: LayoutDashboard,
        roles: ["DRIVER"],
    },
    {
        title: "My Route",
        href: "/driver/route",
        icon: Bus,
        roles: ["DRIVER"],
    },
    {
        title: "Students",
        href: "/driver/students",
        icon: Users,
        roles: ["DRIVER"],
    },
    {
        title: "Attendance",
        href: "/driver/attendance",
        icon: ClipboardList,
        roles: ["DRIVER"],
    },
    {
        title: "Absences",
        href: "/driver/absences",
        icon: CalendarX,
        roles: ["DRIVER"],
    },
    {
        title: "Live Map",
        href: "/admin/map",
        icon: Map,
        roles: ["DRIVER"],
    },
    // ── Parent Portal ──────────────────────────────────────────
    {
        title: "Home",
        href: "/parent",
        icon: LayoutDashboard,
        roles: ["PARENT"],
    },
    {
        title: "My Children",
        href: "/parent/children",
        icon: GraduationCap,
        roles: ["PARENT"],
    },
    {
        title: "Report Absence",
        href: "/parent/absences",
        icon: CalendarX,
        roles: ["PARENT"],
    },
    {
        title: "Emergency Contacts",
        href: "/parent/emergency-contacts",
        icon: Phone,
        roles: ["PARENT"],
    },
    {
        title: "Consents",
        href: "/parent/consents",
        icon: Shield,
        roles: ["PARENT"],
    },
    {
        title: "Notifications",
        href: "/parent/notifications",
        icon: Bell,
        roles: ["PARENT"],
    },
];
