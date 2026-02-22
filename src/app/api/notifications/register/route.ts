import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, device } = body as { token: string; device?: string };

    if (!token || typeof token !== "string") {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Upsert: if the token already exists update its user/device, otherwise create
    await prisma.fcmToken.upsert({
        where: { token },
        update: {
            userId: session.user.id,
            device: device ?? null,
        },
        create: {
            token,
            device: device ?? null,
            userId: session.user.id,
        },
    });

    return NextResponse.json({ ok: true });
}
