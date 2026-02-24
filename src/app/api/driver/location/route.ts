import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DRIVER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { tripId, latitude, longitude } = await req.json();

        console.log(
            `[TRACE-LOC] RECEIVED for Trip ${tripId}: Lat ${latitude}, Lng ${longitude}`
        );

        if (!tripId || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ ATOMIC UPDATE — single source of truth
        const result = await prisma.tripLog.updateMany({
            where: {
                id: tripId,
                driverId: session.user.id,
                status: "ONGOING",
            },
            data: {
                lastLatitude: latitude,
                lastLongitude: longitude,
                lastUpdatedAt: new Date(),
            },
        });

        if (result.count === 0) {
            console.warn(
                `[TRACE-LOC] REJECTED (atomic): Trip ${tripId} not found, not owned, or not ONGOING`
            );
            return NextResponse.json(
                { error: "Trip not active or unauthorized" },
                { status: 400 }
            );
        }

        console.log(
            `[TRACE-LOC] SUCCESS: Atomic update applied for Trip ${tripId}`
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TRACE-LOC] CRITICAL ERROR:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}