import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils/location";
import { sendProximityAlert } from "@/lib/firebase/push-service";

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

        // 2. Proximity Check Logic
        // Fetch trip details with students and their parents' tokens
        const trip = await prisma.tripLog.findUnique({
            where: { id: tripId },
            include: {
                route: {
                    include: {
                        students: {
                            where: {
                                status: "ACTIVE"
                            },
                            include: {
                                parent: {
                                    include: {
                                        fcmTokens: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (trip?.route?.students) {
            const alertedIds = new Set(trip.alertedStudentIds);
            const studentsToNotify = trip.route.students.filter(s =>
                !alertedIds.has(s.id) && s.parent?.fcmTokens.length
            );

            for (const student of studentsToNotify) {
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    student.latitude,
                    student.longitude
                );

                if (distance <= ALERT_DISTANCE_THRESHOLD) {
                    console.log(`[PROXIMITY] Student ${student.name} is ${Math.round(distance)}m away. Triggering alert.`);

                    const tokens = student.parent!.fcmTokens.map(t => t.token);

                    // Send alert (async, don't block response if possible or handle errors)
                    try {
                        await sendProximityAlert(tokens, student.name, distance);

                        // Mark as alerted
                        await prisma.tripLog.update({
                            where: { id: tripId },
                            data: {
                                alertedStudentIds: {
                                    push: student.id
                                }
                            }
                        });
                    } catch (pushErr) {
                        console.error(`[PROXIMITY] Failed to send alert for student ${student.id}:`, pushErr);
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
