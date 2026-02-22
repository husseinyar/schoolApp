import { prisma } from "@/lib/prisma";
import { AuditLog } from "@prisma/client";

export interface DashboardStats {
    counts: {
        students: number;
        routes: number;
        schools: number;
        users: number;
        drivers: number;
        parents: number;
        tripsToday: number;
        absentToday: number;
        notificationsSent: number;
    };
    activeRoutes: {
        id: string;
        name: string;
        status: string;
        driver: { name: string };
        _count: { students: number };
    }[];
    recentActivity: (AuditLog & {
        user: { name: string; email: string };
    })[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
        students,
        routes,
        schools,
        users,
        drivers,
        parents,
        tripsToday,
        absentToday,
        notificationsSent,
        activeRoutes,
        recentActivity,
    ] = await prisma.$transaction([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.route.count({ where: { status: { not: "COMPLETED" } } }),
        prisma.school.count(),
        prisma.user.count(),
        prisma.user.count({ where: { role: "DRIVER" } }),
        prisma.user.count({ where: { role: "PARENT" } }),
        prisma.tripLog.count({ where: { date: { gte: today, lt: tomorrow } } }),
        prisma.absence.count({ where: { date: { gte: today, lt: tomorrow } } }),
        prisma.notification.count(),
        prisma.route.findMany({
            take: 6,
            orderBy: { createdAt: "desc" },
            include: {
                driver: { select: { name: true } },
                _count: { select: { students: true } },
            },
        }),
        prisma.auditLog.findMany({
            take: 6,
            orderBy: { timestamp: "desc" },
            include: { user: { select: { name: true, email: true } } },
        }),
    ]);

    return {
        counts: {
            students,
            routes,
            schools,
            users,
            drivers,
            parents,
            tripsToday,
            absentToday,
            notificationsSent,
        },
        activeRoutes,
        recentActivity,
    };
}
