import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    return session.user;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            participants: { select: { id: true, name: true, role: true } },
            messages: {
                orderBy: { createdAt: "asc" },
                include: { sender: { select: { id: true, name: true } } },
            },
        },
    });

    if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if user is participant
    if (!conversation.participants.some((p) => p.id === user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ conversation });
}
