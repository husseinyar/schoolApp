import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "DRIVER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const route = await prisma.route.findFirst({
        where: { driverId: session.user.id },
        include: {
            school: { select: { name: true, addressStreet: true, addressCity: true } },
            stops: { orderBy: { orderIndex: "asc" } },
            students: {
                where: { status: "ACTIVE" },
                orderBy: { name: "asc" },
                select: {
                    id: true, name: true, studentCode: true, grade: true, photoURL: true,
                    addressStreet: true, addressCity: true, status: true,
                },
            },
            _count: { select: { students: true } },
        },
    });

    if (!route) return NextResponse.json({ error: "No route assigned" }, { status: 404 });

    return NextResponse.json({ route });
}
