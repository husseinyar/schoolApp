import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "PARENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = session.user.id;

    const [students, unreadCount, nextAbsence] = await Promise.all([
        prisma.student.findMany({
            where: { parentId: userId },
            include: {
                route: {
                    select: {
                        id: true,
                        name: true,
                        startTime: true,
                        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                        driver: { select: { name: true } },
                        tripLogs: {
                            where: { status: "ONGOING" },
                            take: 1,
                            select: { status: true },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
        prisma.notification.count({
            where: {
                OR: [
                    { targetType: "ALL" },
                    { targetType: "ROLE", targetValue: "PARENT" },
                    { targetType: "USER", targetValue: userId },
                ],
            },
        }),
        // Next upcoming absence entered by this parent
        prisma.absence.findFirst({
            where: {
                reportedById: userId,
                date: { gte: new Date() },
            },
            include: { student: { select: { name: true } } },
            orderBy: { date: "asc" },
        }),
    ]);

    const activeStudents = students.filter((s) => s.status === "ACTIVE");
    const assignedRoutes = students.filter((s) => s.route !== null).length;

    return NextResponse.json({
        totalChildren: students.length,
        activeChildren: activeStudents.length,
        assignedRoutes,
        notificationCount: unreadCount,
        nextAbsence,
        students,
    });
}
