
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        // Only admins and drivers should see the full map? Or maybe just admins.
        // The task said "Global Map View" for "key administrators".
        const auth = await ensureRole(["ADMIN", "DRIVER"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const routes = await prisma.route.findMany({
            // where: { status: { not: "COMPLETED" } }, // Optional: Filter by status
            include: {
                school: true,
                stops: {
                    orderBy: { orderIndex: 'asc' }
                },
                driver: {
                    select: { id: true, name: true, phone: true }
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        return successResponse(routes);
    });
}
