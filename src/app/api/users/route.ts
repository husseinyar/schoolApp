
import { NextRequest } from "next/server";
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ensureRole } from "@/lib/api-auth";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { emailService } from "@/lib/email/email-service";
import { getWelcomeEmail } from "@/lib/email/templates";

// Schema for creating a user
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.nativeEnum(Role),
    schoolId: z.string().optional(),
});

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        // 1. Auth Check (Admin only)
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) {
            throw new ApiError("Unauthorized", 403, "FORBIDDEN");
        }

        // 2. Parse Query Params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role");

        const skip = (page - 1) * limit;

        // 3. Build Where Clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role && Object.values(Role).includes(role as Role)) {
            where.role = role;
        }

        // 4. Fetch Data
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    school: { select: { name: true } }, // Include school name
                    createdAt: true,
                    // Exclude password
                },
            }),
            prisma.user.count({ where }),
        ]);

        // 5. Return Response
        return successResponse({
            users,
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
        // 1. Auth Check
        const auth = await ensureRole(["ADMIN"]);
        if (!auth.authorized) {
            throw new ApiError("Unauthorized", 403, "FORBIDDEN");
        }

        // 2. Validate Input
        const body = await req.json();
        const data = createUserSchema.parse(body);

        // 3. Check for Existing User
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ApiError("User already exists", 400, "USER_EXISTS");
        }

        // 4. Hash Password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Create User
        const newUser = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
                role: data.role,
                // @ts-ignore
                schoolId: data.schoolId || undefined,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        // 6. Send Welcome Email (Non-blocking)
        const welcomeEmail = getWelcomeEmail(newUser.name, process.env.NEXTAUTH_URL || "http://localhost:3000");
        // We don't await this to keep the API fast
        emailService.sendEmail(newUser.email, welcomeEmail.subject, welcomeEmail.html).catch(err => {
            console.error("Failed to send welcome email:", err);
        });

        return successResponse(newUser, 201);
    });
}
