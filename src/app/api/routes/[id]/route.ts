
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";
import { sendToUser } from "@/lib/firebase/notification-service";

const updateRouteSchema = z.object({
    name: z.string().min(1).optional(),
    schoolId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    capacity: z.coerce.number().min(1).optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    monday: z.boolean().optional(),
    tuesday: z.boolean().optional(),
    wednesday: z.boolean().optional(),
    thursday: z.boolean().optional(),
    friday: z.boolean().optional(),
    status: z.enum(["IDLE", "EN_ROUTE_TO_SCHOOL", "AT_SCHOOL", "EN_ROUTE_FROM_SCHOOL", "COMPLETED", "DELAYED", "EMERGENCY"]).optional(),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;

        // Allow drivers to see their own route
        const auth = await ensureRole(["ADMIN", "DRIVER"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const route = await prisma.route.findUnique({
            where: { id },
            include: {
                school: true,
                driver: { select: { id: true, name: true, email: true, phone: true } },
                stops: { orderBy: { orderIndex: 'asc' } },
                _count: { select: { students: true } }
            }
        });

        if (!route) throw new ApiError("Route not found", 404, "ROUTE_NOT_FOUND");

        if (auth.user?.role === "DRIVER" && route.driverId !== auth.user.id) {
            throw new ApiError("Unauthorized", 403, "FORBIDDEN");
        }

        return successResponse(route);
    });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const body = await req.json();
        const data = updateRouteSchema.parse(body);

        // Verify school/driver if changing
        if (data.schoolId) {
            const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
            if (!school) throw new ApiError("School not found", 404, "SCHOOL_NOT_FOUND");
        }
        if (data.driverId) {
            const driver = await prisma.user.findUnique({ where: { id: data.driverId } });
            if (!driver || driver.role !== "DRIVER") throw new ApiError("Invalid driver", 400, "INVALID_DRIVER");
        }

        const updatedRoute = await prisma.route.update({
            where: { id },
            data: data,
            include: {
                school: true,
                driver: { select: { id: true, name: true } }
            }
        });

        // Notify Driver of changes
        if (updatedRoute.driverId) {
            try {
                const message = data.driverId
                    ? `You have been assigned to route: ${updatedRoute.name}`
                    : `Route "${updatedRoute.name}" details have been updated by admin.`;

                await sendToUser(
                    updatedRoute.driverId,
                    "Route Update",
                    message,
                    auth.user!.id
                );
            } catch (notifyErr) {
                console.error("Failed to notify driver:", notifyErr);
            }
        }

        return successResponse(updatedRoute);
    });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        // Check for active students
        const route = await prisma.route.findUnique({
            where: { id },
            include: { _count: { select: { students: true } } }
        });

        if (route && route._count.students > 0) {
            throw new ApiError("Cannot delete route with assigned students", 400, "ROUTE_HAS_STUDENTS");
        }

        await prisma.route.delete({
            where: { id },
        });

        return successResponse({ deleted: true });
    });
}
