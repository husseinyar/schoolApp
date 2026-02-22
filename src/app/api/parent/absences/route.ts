import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const absenceSchema = z.object({
    studentId: z.string().min(1),
    date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
    reason: z.string().optional(),
    note: z.string().optional(),
});

async function getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "PARENT") return null;
    return session;
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Verify parent owns the student
    const where: Record<string, unknown> = { reportedById: session.user.id };
    if (studentId) where.studentId = studentId;

    const absences = await prisma.absence.findMany({
        where,
        include: { student: { select: { name: true, studentCode: true } } },
        orderBy: { date: "desc" },
    });

    return NextResponse.json({ absences });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = absenceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { studentId, date, reason, note } = parsed.data;

    // Verify parent owns this student
    const student = await prisma.student.findFirst({
        where: { id: studentId, parentId: session.user.id },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const absence = await prisma.absence.create({
        data: {
            studentId,
            reportedById: session.user.id,
            date: new Date(date),
            reason: reason ?? null,
            note: note ?? null,
        },
        include: { student: { select: { name: true } } },
    });

    return NextResponse.json({ absence }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const absence = await prisma.absence.findFirst({
        where: { id, reportedById: session.user.id },
    });
    if (!absence) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.absence.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
