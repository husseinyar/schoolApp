
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";

const createStopSchema = z.object({
    name: z.string().min(1, "Stop name is required"),
    address: z.string().min(3, "Address is required"),
    latitude: z.number(),
    longitude: z.number(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
    orderIndex: z.number().int().min(0),
});

const createRouteSchema = z.object({
    name: z.string().min(1, "Name is required"),
    schoolId: z.string().min(1, "School is required"),
    driverId: z.string().min(1, "Driver is required"),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    monday: z.boolean().default(true),
    tuesday: z.boolean().default(true),
    wednesday: z.boolean().default(true),
    thursday: z.boolean().default(true),
    friday: z.boolean().default(true),
    stops: z.array(createStopSchema).optional().default([]),
});

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        const auth = await ensureRole(["ADMIN", "DRIVER", "PARENT"]); // Parents might need to see routes too? For now Admin/Driver.
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const schoolId = searchParams.get("schoolId");
        const driverId = searchParams.get("driverId");

        const skip = (page - 1) * limit;

        const where: any = {};
        if (schoolId) where.schoolId = schoolId;
        if (driverId) where.driverId = driverId;

        // For drivers, they should only see their own routes if they are not admin
        if (auth.user?.role === "DRIVER") {
            where.driverId = auth.user.id;
        }

        const [routes, total] = await Promise.all([
            prisma.route.findMany({
                where,
                skip,
                take: limit,
                include: {
                    school: { select: { name: true } },
                    driver: { select: { name: true, email: true } },
                    _count: { select: { students: true, stops: true } }
                },
                orderBy: { name: "asc" },
            }),
            prisma.route.count({ where }),
        ]);

        return successResponse({
            routes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    });
}

export async function POST(req: NextRequest) {
    return apiHandler(async () => {
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const body = await req.json();
        const data = createRouteSchema.parse(body);

        // Verify school and driver exist
        const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
        if (!school) throw new ApiError("School not found", 404, "SCHOOL_NOT_FOUND");

        const driver = await prisma.user.findUnique({ where: { id: data.driverId } });
        if (!driver || driver.role !== "DRIVER") throw new ApiError("Invalid driver", 400, "INVALID_DRIVER");

        const route = await prisma.route.create({
            data: {
                name: data.name,
                schoolId: data.schoolId,
                driverId: data.driverId,
                capacity: data.capacity,
                startTime: data.startTime,
                endTime: data.endTime,
                monday: data.monday,
                tuesday: data.tuesday,
                wednesday: data.wednesday,
                thursday: data.thursday,
                friday: data.friday,
                stops: {
                    create: data.stops.map(stop => ({
                        name: stop.name,
                        address: stop.address,
                        latitude: stop.latitude,
                        longitude: stop.longitude,
                        postalCode: stop.postalCode,
                        city: stop.city,
                        scheduledTime: stop.scheduledTime,
                        orderIndex: stop.orderIndex,
                    }))
                }
            },
            include: {
                school: true,
                driver: true,
                stops: true
            }
        });

        return successResponse(route, 201);
    });
}
