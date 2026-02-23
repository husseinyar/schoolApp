import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export async function POST(req: NextRequest) {
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

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message ?? "Validation error", details: parsed.error.flatten().fieldErrors },
            { status: 422 }
        );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
        return NextResponse.json(
            { error: "No password set for this account" },
            { status: 400 }
        );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hash },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
}
