import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { sendToAll, sendToRole, sendToUser } from "@/lib/firebase/notification-service";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await req.json();
    const {
        title,
        body: messageBody,
        target,
        roleTarget,
        userId,
    } = body as {
        title: string;
        body: string;
        target: "ALL" | "ROLE" | "USER";
        roleTarget?: Role;
        userId?: string;
    };

    if (!title || !messageBody || !target) {
        return NextResponse.json({ error: "title, body, and target are required" }, { status: 400 });
    }

    let result;
    try {
        if (target === "ALL") {
            result = await sendToAll(title, messageBody, session.user.id);
        } else if (target === "ROLE" && roleTarget) {
            result = await sendToRole(roleTarget, title, messageBody, session.user.id);
        } else if (target === "USER" && userId) {
            result = await sendToUser(userId, title, messageBody, session.user.id);
        } else {
            return NextResponse.json({ error: "Invalid target configuration" }, { status: 400 });
        }

        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        console.error("[notifications/send]", err);
        return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }
}
