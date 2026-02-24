
import { NextRequest, NextResponse } from "next/server";
import { apiHandler, successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
    try {
        const auth = await ensureRole(["ADMIN", "DRIVER"]);
        if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // Use a much wider relative date range (last 24 hours) instead of strictly "today"
        // This prevents buses from disappearing due to timezone differences or late-night trips.
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        console.log(`[TRACE-MAP] Starting Admin Fetch (Filter since: ${twentyFourHoursAgo.toISOString()})`);

        const routes = await prisma.route.findMany({
            include: {
                school: true,
                stops: {
                    orderBy: { orderIndex: 'asc' }
                },
                driver: {
                    select: { id: true, name: true, phone: true }
                },
                tripLogs: {
                    where: {
                        OR: [
                            { status: "ONGOING" },
                            { startedAt: { gte: twentyFourHoursAgo } }
                        ]
                    },
                    orderBy: { startedAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        // Trace details for each route
        const debugInfo = routes.map(r => {
            const trip = r.tripLogs?.[0];
            return {
                route: r.name,
                hasTrip: !!trip,
                status: trip?.status,
                lat: trip?.lastLatitude,
                lng: trip?.lastLongitude,
                updated: trip?.lastUpdatedAt
            };
        });

        console.log("[TRACE-MAP] Data returned:", JSON.stringify(debugInfo, null, 2));

        // Coordinate Validation
        const formattedRoutes = routes.map(route => {
            const activeTrip = route.tripLogs?.[0];

            // Check if coordinates exist and are non-zero
            const hasCoords = activeTrip &&
                activeTrip.lastLatitude !== null &&
                activeTrip.lastLongitude !== null &&
                !(activeTrip.lastLatitude === 0 && activeTrip.lastLongitude === 0);

            return {
                ...route,
                tripLogs: activeTrip ? [{
                    ...activeTrip,
                    // If invalid coords, set to null to prevent map errors
                    lastLatitude: hasCoords ? activeTrip.lastLatitude : null,
                    lastLongitude: hasCoords ? activeTrip.lastLongitude : null,
                }] : []
            };
        });

        return successResponse(formattedRoutes);

    } catch (error: any) {
        console.error("[TRACE-MAP] CRITICAL ERROR:", error);
        return NextResponse.json({
            error: "Failed to fetch active routes",
            detail: error.message
        }, { status: 500 });
    }
}
