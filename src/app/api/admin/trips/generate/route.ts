import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Determine today's day of week
        const now = new Date();
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const todayKey = days[now.getDay()];

        // 2. Get today's date at midnight for idempotency checks
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 3. Find all routes scheduled for today
        const routesScheduledToday = await prisma.route.findMany({
            where: {
                [todayKey]: true,
            },
            select: {
                id: true,
                driverId: true,
                name: true,
            },
        });

        if (routesScheduledToday.length === 0) {
            return NextResponse.json({
                success: true,
                message: `No routes scheduled for today (${todayKey})`,
                count: 0
            });
        }

        // 4. For each route, create a TripLog if one doesn't already exist for today
        const results = await Promise.all(
            routesScheduledToday.map(async (route) => {
                const existing = await prisma.tripLog.findFirst({
                    where: {
                        routeId: route.id,
                        date: todayDate,
                    },
                });

                if (!existing) {
                    return await prisma.tripLog.create({
                        data: {
                            routeId: route.id,
                            driverId: route.driverId,
                            date: todayDate,
                            status: "ONGOING",
                        },
                    });
                }
                return null;
            })
        );

        const createdCount = results.filter(r => r !== null).length;

        return NextResponse.json({
            success: true,
            message: `Processed ${routesScheduledToday.length} routes. Created ${createdCount} new trips.`,
            count: createdCount
        });
    } catch (error) {
        console.error("[TRIP-GENERATE] Error generating trips:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
