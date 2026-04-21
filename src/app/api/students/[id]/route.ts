
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";

const updateStudentSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    dateOfBirth: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    grade: z.coerce.number().min(0).max(12).optional(),
    schoolId: z.string().min(1, "School is required").optional(),
    parentId: z.string().nullable().optional(),
    routeId: z.string().nullable().optional(),
    stopId: z.string().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"]).optional(),

    // Address — relaxed: city/postal may be empty (auto-filled by Google Places)
    addressStreet: z.string().min(1, "Street address is required").optional(),
    addressCity: z.string().optional().default(""),
    addressPostal: z.string().optional().default(""),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

// Shared update logic
async function updateStudent(id: string, body: unknown) {
    const data = updateStudentSchema.parse(body);
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Student not found", 404, "NOT_FOUND");

    // Cross-validate Stop and Route
    const targetRouteId = data.routeId !== undefined ? data.routeId : existing.routeId;
    const targetStopId = data.stopId !== undefined ? data.stopId : existing.stopId;

    if (targetStopId && targetRouteId) {
        const stop = await prisma.stop.findFirst({
            where: { id: targetStopId, routeId: targetRouteId }
        });
        if (!stop) {
            throw new ApiError("Selected stop does not belong to the selected route", 400, "INVALID_STOP");
        }
    }

    const student = await prisma.student.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
            ...(data.grade !== undefined && { grade: data.grade }),
            ...(data.schoolId && { schoolId: data.schoolId }),
            ...(data.parentId !== undefined && { parentId: data.parentId }),
            ...(data.routeId !== undefined && { routeId: data.routeId }),
            ...(data.stopId !== undefined && { stopId: data.stopId }),
            ...(data.status && { status: data.status }),
            ...(data.addressStreet && { addressStreet: data.addressStreet }),
            ...(data.addressCity !== undefined && { addressCity: data.addressCity }),
            ...(data.addressPostal !== undefined && { addressPostal: data.addressPostal }),
            ...(data.latitude !== undefined && { latitude: data.latitude }),
            ...(data.longitude !== undefined && { longitude: data.longitude }),
        },
        include: { school: true, stop: true },
    });
    return successResponse(student);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN", "DRIVER", "PARENT"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                school: true,
                parent: { select: { id: true, name: true, email: true, phone: true } },
                route: true,
                stop: true,
            },
        });

        if (!student) throw new ApiError("Student not found", 404, "NOT_FOUND");

        // RBAC Checks
        if (auth.user?.role === "PARENT") {
            if (student.parentId !== auth.user.id) {
                throw new ApiError("Unauthorized", 403, "FORBIDDEN");
            }
        }

        // Drivers might need to check if student is on their route, but for now allow access if they have the ID
        // (Simplification for now, can be tightened later)

        return successResponse(student);
    });
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]); // Only admins can update for now
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");
        const body = await req.json();
        return updateStudent(id, body);
    });
}

// PATCH — alias for PUT, used by the Edit Student form
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");
        const body = await req.json();
        return updateStudent(id, body);
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        // Check existence
        const existing = await prisma.student.findUnique({ where: { id } });
        if (!existing) throw new ApiError("Student not found", 404, "NOT_FOUND");

        await prisma.student.delete({ where: { id } });

        return successResponse({ success: true, message: "Student deleted" });
    });
}
