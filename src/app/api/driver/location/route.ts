import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils/location";
import { sendProximityAlertToUser } from "@/lib/firebase/notification-service";

const ALERT_DISTANCE_THRESHOLD = 500; // meters

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DRIVER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { tripId, latitude, longitude } = await req.json();

        if (!tripId || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. ATOMIC UPDATE bus location
        const updateResult = await prisma.tripLog.updateMany({
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

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "Trip not active or unauthorized" },
                { status: 400 }
            );
        }

        // 2. Proximity Check Logic (STOP-BASED)
        // Fetch trip with route stops and the students assigned to those stops
        const trip = await prisma.tripLog.findUnique({
            where: { id: tripId },
            include: {
                route: {
                    include: {
                        stops: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                students: {
                                    where: { status: "ACTIVE" },
                                    include: {
                                        parent: {
                                            include: { fcmTokens: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (trip?.route?.stops) {
            const alertedStopIds = new Set(trip.alertedStopIds);
            
            for (const stop of trip.route.stops) {
                // 1. Skip if stop already alerted for this trip
                if (alertedStopIds.has(stop.id)) continue;

                // 2. Calculate distance to the stop
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    stop.latitude,
                    stop.longitude
                );

                if (distance <= ALERT_DISTANCE_THRESHOLD) {
                    // 3. Atomic "Claim" of the stop alert
                    const claimed = await prisma.tripLog.updateMany({
                        where: {
                            id: tripId,
                            NOT: {
                                alertedStopIds: {
                                    has: stop.id
                                }
                            }
                        },
                        data: {
                            alertedStopIds: {
                                push: stop.id
                            }
                        }
                    });

                    // If count is 0, another ping already handled this stop
                    if (claimed.count === 0) continue;

                    console.log(`[PROXIMITY] Bus is approaching stop: ${stop.name} (${Math.round(distance)}m).`);

                    // 4. Notify students assigned to this stop
                    for (const student of stop.students) {
                        if (!student.parentId) continue;

                        // 5. Fire-and-forget notification (now includes DB logging)
                        sendProximityAlertToUser(
                            student.parentId,
                            student.name,
                            stop.name,
                            session.user.id
                        ).catch(pushErr => {
                            console.error(`[PROXIMITY] Failed to alert parent of ${student.name}:`, pushErr);
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TRACE-LOC] CRITICAL ERROR:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
