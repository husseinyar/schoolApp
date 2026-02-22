import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "DRIVER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Find driver's route
    const route = await prisma.route.findFirst({
        where: { driverId: session.user.id },
        select: { id: true },
    });

    if (!route) return NextResponse.json({ absences: [] });

    const absences = await prisma.absence.findMany({
        where: {
            student: { routeId: route.id },
            date: { gte: dayStart, lt: dayEnd },
        },
        include: {
            student: {
                select: { id: true, name: true, studentCode: true, grade: true, photoURL: true },
            },
            reportedBy: { select: { name: true, email: true } },
        },
        orderBy: { student: { name: "asc" } },
    });

    return NextResponse.json({ absences, date: dateStr });
}
