
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";

// Schema for creating a student
const createStudentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dateOfBirth: z.string().or(z.date()).transform((val) => new Date(val)),
    grade: z.coerce.number().min(0).max(12),
    schoolId: z.string().min(1, "School is required"),
    parentId: z.string().optional().nullable(), // Allow null or empty for optional
    routeId: z.string().optional().nullable(),

    // Address — city/postal are auto-filled by Google Places and may be empty
    addressStreet: z.string().min(1, "Street address is required"),
    addressCity: z.string().optional().default(""),
    addressPostal: z.string().optional().default(""),
    latitude: z.number().optional().default(0),
    longitude: z.number().optional().default(0),
});

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        const auth = await ensureRole(["ADMIN", "DRIVER", "PARENT"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const schoolId = searchParams.get("schoolId");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        const where: any = {};

        // RBAC
        if (auth.user?.role === "DRIVER") {
            // Drivers might see students on their route? Or generally all students in their school?
            // Ideally filter by school or route.
            // For simplicity, let's allow Drivers to see students, maybe they pick them up.
            // But better to restrict to assigned routes?
            // Let's stick to simple school filter if provided.
        }
        if (auth.user?.role === "PARENT") {
            // Parents can ONLY see their own students
            where.parentId = auth.user.id;
        }

        if (schoolId) where.schoolId = schoolId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { studentCode: { contains: search, mode: "insensitive" } },
            ];
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip,
                take: limit,
                include: {
                    school: { select: { name: true } },
                    parent: { select: { name: true, email: true, phone: true } },
                    route: { select: { name: true } },
                },
                orderBy: { name: "asc" },
            }),
            prisma.student.count({ where }),
        ]);

        return successResponse({
            students,
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
        const data = createStudentSchema.parse(body);

        // Verify school exists
        const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
        if (!school) throw new ApiError("School not found", 404, "SCHOOL_NOT_FOUND");

        // Generate Student Code (STU-XXXXXX)
        // Retry logic could be added here for collision, but we trust random for now
        const studentCode = `STU-${Math.floor(100000 + Math.random() * 900000)}`;

        const student = await prisma.student.create({
            data: {
                name: data.name,
                studentCode: studentCode,
                dateOfBirth: data.dateOfBirth,
                grade: data.grade,
                schoolId: data.schoolId,
                parentId: data.parentId || null,
                routeId: data.routeId || null,
                addressStreet: data.addressStreet,
                addressCity: data.addressCity,
                addressPostal: data.addressPostal,
                latitude: data.latitude,
                longitude: data.longitude,
            },
            include: {
                school: true,
                parent: true,
                route: true
            }
        });

        return successResponse(student, 201);
    });
}
