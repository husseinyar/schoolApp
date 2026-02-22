
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";

// Schema for creating a school
const createSchoolSchema = z.object({
    name: z.string().min(1, "Name is required"),
    addressStreet: z.string().min(1, "Street address is required"),
    addressCity: z.string().min(1, "City is required"),
    addressPostal: z.string().min(1, "Postal code is required"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
});

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { addressCity: { contains: search, mode: "insensitive" } },
            ];
        }

        const [schools, total] = await Promise.all([
            prisma.school.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.school.count({ where }),
        ]);

        return successResponse({
            schools,
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
        const data = createSchoolSchema.parse(body);

        const school = await prisma.school.create({
            data: {
                name: data.name,
                addressStreet: data.addressStreet,
                addressCity: data.addressCity,
                addressPostal: data.addressPostal,
                latitude: data.latitude,
                longitude: data.longitude,
                contactEmail: data.contactEmail || "",
                contactPhone: data.contactPhone || "",
            },
        });

        return successResponse(school, 201);
    });
}
