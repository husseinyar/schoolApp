import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80).optional(),
    phone: z
        .string()
        .regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone number")
        .optional()
        .nullable(),
    settings: z
        .object({
            emailNotifications: z.boolean().optional(),
            pushNotifications: z.boolean().optional(),
            smsNotifications: z.boolean().optional(),
            absenceAlerts: z.boolean().optional(),
            routeDelayAlerts: z.boolean().optional(),
        })
        .optional(),
});

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            settings: true,
            lastLoginAt: true,
            createdAt: true,
            school: {
                select: { id: true, name: true },
            },
            routes: {
                select: { id: true, name: true },
                take: 5,
            },
        },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation error", details: parsed.error.flatten().fieldErrors },
            { status: 422 }
        );
    }

    const { name, phone, settings } = parsed.data;

    // Merge settings with existing
    const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { settings: true },
    });

    const mergedSettings = settings
        ? { ...(existing?.settings as object ?? {}), ...settings }
        : undefined;

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
            ...(mergedSettings && { settings: mergedSettings }),
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            settings: true,
        },
    });

    return NextResponse.json({ success: true, data: updated });
}
