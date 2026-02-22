import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
    studentId: z.string().min(1),
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal("")),
    isPrimary: z.boolean().optional(),
});

const updateSchema = contactSchema.extend({ id: z.string().min(1) });

async function getSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "PARENT") return null;
    return session;
}

async function verifyStudentOwnership(studentId: string, parentId: string) {
    return prisma.student.findFirst({ where: { id: studentId, parentId } });
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 });

    const student = await verifyStudentOwnership(studentId, session.user.id);
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contacts = await prisma.emergencyContact.findMany({
        where: { studentId },
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { studentId, name, relationship, phone, email, isPrimary } = parsed.data;

    const student = await verifyStudentOwnership(studentId, session.user.id);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // If setting as primary, unset others
    if (isPrimary) {
        await prisma.emergencyContact.updateMany({
            where: { studentId },
            data: { isPrimary: false },
        });
    }

    const contact = await prisma.emergencyContact.create({
        data: { studentId, name, relationship, phone, email: email || null, isPrimary: isPrimary ?? false },
    });

    return NextResponse.json({ contact }, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { id, studentId, name, relationship, phone, email, isPrimary } = parsed.data;

    const student = await verifyStudentOwnership(studentId, session.user.id);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    if (isPrimary) {
        await prisma.emergencyContact.updateMany({
            where: { studentId, NOT: { id } },
            data: { isPrimary: false },
        });
    }

    const contact = await prisma.emergencyContact.update({
        where: { id },
        data: { name, relationship, phone, email: email || null, isPrimary: isPrimary ?? false },
    });

    return NextResponse.json({ contact });
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const contact = await prisma.emergencyContact.findFirst({
        where: { id, student: { parentId: session.user.id } },
    });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.emergencyContact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
