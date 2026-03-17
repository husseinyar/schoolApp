import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    return session.user;
}

export async function GET() {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
        where: { participants: { some: { id: user.id } } },
        include: {
            participants: { select: { id: true, name: true, role: true } },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { conversationId, recipientId, content } = body;

        let targetConversationId = conversationId;

        if (!targetConversationId && recipientId) {
            // Find or create conversation between these two
            // For simplicity in this demo, we lookup by dual participation
            const existing = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { id: user.id } } },
                        { participants: { some: { id: recipientId } } },
                    ],
                },
            });

            if (existing) {
                targetConversationId = existing.id;
            } else {
                const newConv = await prisma.conversation.create({
                    data: {
                        participants: { connect: [{ id: user.id }, { id: recipientId }] },
                    },
                });
                targetConversationId = newConv.id;
            }
        }

        if (!targetConversationId) {
            return NextResponse.json({ error: "Target recipient or conversation required" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                conversationId: targetConversationId,
                senderId: user.id,
                body: content,
            },
        });

        await prisma.conversation.update({
            where: { id: targetConversationId },
            data: { lastMessageAt: new Date() },
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
