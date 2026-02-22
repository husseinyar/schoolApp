
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

const updateUserSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    role: z.nativeEnum(Role).optional(),
    schoolId: z.string().optional().nullable(),
    password: z.string().min(6).optional(), // Allow password reset
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

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                schoolId: true,
                school: { select: { name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new ApiError("User not found", 404, "USER_NOT_FOUND");
        }

        return successResponse(user);
    });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        const body = await req.json();
        const data = updateUserSchema.parse(body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new ApiError("User not found", 404, "USER_NOT_FOUND");
        }

        // Prepare update data
        const updateData: any = { ...data };

        // Handle password update if present
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                schoolId: true,
                updatedAt: true
            }
        });

        return successResponse(updatedUser);
    });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    return apiHandler(async () => {
        const { id } = await params;
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) throw new ApiError("Unauthorized", 403, "FORBIDDEN");

        // Prevent deleting self (optional best practice)
        if (auth.user?.id === id) {
            throw new ApiError("Cannot delete your own account", 400, "CANNOT_DELETE_SELF");
        }

        await prisma.user.delete({
            where: { id },
        });

        return successResponse({ deleted: true });
    });
}
