
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";

const updateSchoolSchema = z.object({
    name: z.string().min(1).optional(),
    addressStreet: z.string().min(1).optional(),
    addressCity: z.string().min(1).optional(),
    addressPostal: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;

        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { students: true, users: true }
                }
            }
        });

        if (!school) throw new ApiError("School not found", 404, "SCHOOL_NOT_FOUND");

        return successResponse(school);
    });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;

        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const body = await req.json();
        const data = updateSchoolSchema.parse(body);

        const school = await prisma.school.update({
            where: { id },
            data: {
                ...data,
                contactEmail: data.contactEmail,
            },
        });

        return successResponse(school);
    });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;

        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        // Check for related records (students)
        const school = await prisma.school.findUnique({
            where: { id },
            include: { _count: { select: { students: true } } }
        });

        if (school && school._count.students > 0) {
            throw new ApiError("Cannot delete school with registered students", 400, "SCHOOL_HAS_STUDENTS");
        }

        await prisma.school.delete({
            where: { id },
        });

        return successResponse({ deleted: true });
    });
}
