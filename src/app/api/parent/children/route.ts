import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "PARENT") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
        where: { parentId: session.user.id },
        include: {
            route: {
                include: {
                    driver: { select: { name: true, phone: true, email: true } },
                    stops: { orderBy: { orderIndex: "asc" } },
                },
            },
            school: { select: { name: true, addressStreet: true, addressCity: true } },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ students });
}
