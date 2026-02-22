import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getDriver() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DRIVER") return null;
    return session.user;
}

// GET /api/driver/trips  — list trips for the driver
// POST /api/driver/trips — start a new trip

export async function GET() {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const trips = await prisma.tripLog.findMany({
        where: { driverId: driver.id },
        orderBy: { date: "desc" },
        take: 30,
        include: {
            route: { select: { name: true } },
            _count: { select: { attendances: true } },
        },
    });

    return NextResponse.json({ trips });
}

export async function POST(req: NextRequest) {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Find the driver's route
    const route = await prisma.route.findFirst({ where: { driverId: driver.id } });
    if (!route) return NextResponse.json({ error: "No route assigned" }, { status: 404 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for an existing ongoing trip today
    const existing = await prisma.tripLog.findFirst({
        where: { driverId: driver.id, date: { gte: today, lt: tomorrow }, status: "ONGOING" },
    });
    if (existing) return NextResponse.json({ trip: existing, existing: true });

    const body = await req.json().catch(() => ({}));
    const trip = await prisma.tripLog.create({
        data: {
            routeId: route.id,
            driverId: driver.id,
            date: today,
            notes: body.notes ?? null,
        },
    });

    // Pre-populate attendance records for all active students on this route
    const students = await prisma.student.findMany({
        where: { routeId: route.id, status: "ACTIVE" },
        select: { id: true },
    });

    if (students.length > 0) {
        await prisma.attendance.createMany({
            data: students.map((s) => ({ tripLogId: trip.id, studentId: s.id, status: "BOARDED" })),
            skipDuplicates: true,
        });
    }

    return NextResponse.json({ trip }, { status: 201 });
}
