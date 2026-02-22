import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "PARENT") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    // Return notifications addressed to ALL, ROLE=PARENT, or USER=thisUserId
    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: {
                OR: [
                    { targetType: "ALL" },
                    { targetType: "ROLE", targetValue: "PARENT" },
                    { targetType: "USER", targetValue: session.user.id },
                ],
            },
            orderBy: { sentAt: "desc" },
            skip,
            take: limit,
            include: { sentBy: { select: { name: true } } },
        }),
        prisma.notification.count({
            where: {
                OR: [
                    { targetType: "ALL" },
                    { targetType: "ROLE", targetValue: "PARENT" },
                    { targetType: "USER", targetValue: session.user.id },
                ],
            },
        }),
    ]);

    return NextResponse.json({ notifications, total, page, limit });
}
