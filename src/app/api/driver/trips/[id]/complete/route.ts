import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getDriver() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DRIVER") return null;
    return session.user;
}

// POST /api/driver/trips/[id]/complete
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Next.js 15: params is a Promise — must be awaited
    const { id } = await params;

    const tripLog = await prisma.tripLog.findFirst({
        where: { id, driverId: driver.id },
    });
    if (!tripLog) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    if (tripLog.status !== "ONGOING") {
        return NextResponse.json({ error: "Trip is not ongoing" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const updated = await prisma.tripLog.update({
        where: { id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            notes: body.notes ?? tripLog.notes,
        },
    });

    return NextResponse.json({ trip: updated });
}
