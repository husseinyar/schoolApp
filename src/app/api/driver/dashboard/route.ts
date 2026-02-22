import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "DRIVER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const driverId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [route, todayTrip, recentTrips] = await Promise.all([
        prisma.route.findFirst({
            where: { driverId },
            include: {
                school: { select: { name: true } },
                stops: { orderBy: { orderIndex: "asc" } },
                _count: { select: { students: true } },
            },
        }),
        prisma.tripLog.findFirst({
            where: {
                driverId,
                date: { gte: today, lt: tomorrow },
                status: "ONGOING",
            },
        }),
        prisma.tripLog.findMany({
            where: { driverId },
            orderBy: { date: "desc" },
            take: 5,
            include: {
                _count: { select: { attendances: true } },
            },
        }),
    ]);

    // Count parent-reported absences for today for the driver's route
    const absentToday = route
        ? await prisma.absence.count({
            where: {
                student: { routeId: route.id },
                date: { gte: today, lt: tomorrow },
            },
        })
        : 0;

    return NextResponse.json({
        route,
        todayTrip,
        recentTrips,
        absentToday,
        studentCount: route?._count?.students ?? 0,
    });
}
