
import { NextResponse } from "next/server";
import { ensureRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { authorized, response } = await ensureRole(["ADMIN"]);
    if (!authorized) return response as NextResponse;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                skip,
                take: limit,
                orderBy: { timestamp: "desc" },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }),
            prisma.auditLog.count()
        ]);

        return NextResponse.json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Audit API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
