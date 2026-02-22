import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
    tripLogId: z.string().min(1),
    studentId: z.string().min(1),
    status: z.enum(["BOARDED", "ABSENT", "LATE"]),
    note: z.string().optional(),
});

async function getDriver() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DRIVER") return null;
    return session.user;
}

// GET /api/driver/attendance?tripLogId=xxx
export async function GET(req: NextRequest) {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tripLogId = searchParams.get("tripLogId");
    if (!tripLogId) return NextResponse.json({ error: "Missing tripLogId" }, { status: 400 });

    // Verify this trip belongs to the driver
    const trip = await prisma.tripLog.findFirst({
        where: { id: tripLogId, driverId: driver.id },
    });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const attendances = await prisma.attendance.findMany({
        where: { tripLogId },
        include: {
            student: {
                select: {
                    id: true, name: true, studentCode: true, photoURL: true, grade: true,
                },
            },
        },
        orderBy: { student: { name: "asc" } },
    });

    return NextResponse.json({ attendances });
}

// POST /api/driver/attendance — upsert a single student's attendance
export async function POST(req: NextRequest) {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { tripLogId, studentId, status, note } = parsed.data;

    // Verify trip ownership
    const trip = await prisma.tripLog.findFirst({
        where: { id: tripLogId, driverId: driver.id, status: "ONGOING" },
    });
    if (!trip) return NextResponse.json({ error: "No ongoing trip found" }, { status: 404 });

    const attendance = await prisma.attendance.upsert({
        where: { tripLogId_studentId: { tripLogId, studentId } },
        update: { status, note: note ?? null },
        create: { tripLogId, studentId, status, note: note ?? null },
    });

    return NextResponse.json({ attendance });
}
