
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentImportSchema } from "@/lib/validations/import";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { students, filename } = body;

        if (!Array.isArray(students) || students.length === 0) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        // Begin transaction
        await prisma.$transaction(async (tx) => {
            for (const student of students) {
                const result = studentImportSchema.safeParse(student);
                if (!result.success) {
                    errors.push({ student: student.name, message: result.error.issues[0].message });
                    failCount++;
                    continue;
                }

                const data = result.data;

                // Check if school exists
                const schoolExists = await tx.school.findUnique({
                    where: { id: data.schoolId }
                });

                if (!schoolExists) {
                    errors.push({ student: data.name, message: "School not found" });
                    failCount++;
                    continue;
                }

                // Generate Student Code (STU-XXXXXX)
                const studentCode = `STU-${Math.floor(100000 + Math.random() * 900000)}`;

                try {
                    await tx.student.create({
                        data: {
                            name: data.name,
                            studentCode: studentCode,
                            dateOfBirth: new Date(data.dateOfBirth),
                            grade: data.grade,
                            schoolId: data.schoolId,
                            parentId: data.parentId || null,
                            addressStreet: data.addressStreet,
                            addressPostal: data.addressPostal,
                            addressCity: data.addressCity,
                            latitude: data.latitude,
                            longitude: data.longitude
                        }
                    });
                    successCount++;
                } catch (e) {
                    failCount++;
                    errors.push({ student: data.name, message: "Database error" });
                }
            }

            // Create Import Job Record
            await tx.importJob.create({
                data: {
                    userId: session.user.id,
                    type: "STUDENT_IMPORT",
                    filename: filename || "unknown.csv",
                    status: failCount === students.length ? "FAILED" : "COMPLETED",
                    total: students.length,
                    success: successCount,
                    failed: failCount,
                }
            });
        });

        return NextResponse.json({
            success: true,
            summary: {
                imported: successCount,
                failed: failCount,
                errors
            }
        });

    } catch (error) {
        console.error("Import commit error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
