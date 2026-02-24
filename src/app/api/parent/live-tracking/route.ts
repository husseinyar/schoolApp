import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "PARENT") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // 1. Get all routes assigned to students of this parent
        const routes = await prisma.route.findMany({
            where: {
                students: {
                    some: {
                        parentId: session.user.id,
                    },
                },
            },
            include: {
                school: {
                    select: {
                        name: true,
                        latitude: true,
                        longitude: true,
                    },
                },
                driver: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                stops: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
                tripLogs: {
                    where: {
                        status: "ONGOING",
                    },
                    orderBy: {
                        lastUpdatedAt: "desc",
                    },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        lastLatitude: true,
                        lastLongitude: true,
                        lastUpdatedAt: true,
                    },
                },
                // Include which of the parent's children are on this route
                students: {
                    where: {
                        parentId: session.user.id,
                    },
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: routes });
    } catch (error) {
        console.error("[PARENT-LIVE] Error fetching live tracking:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
