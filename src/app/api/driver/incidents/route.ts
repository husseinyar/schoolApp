import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToRole } from "@/lib/firebase/notification-service";

async function getDriver() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "DRIVER") return null;
    return session.user;
}

export async function POST(req: NextRequest) {
    const driver = await getDriver();
    if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { type, severity, description, tripLogId } = body;

        if (!type || !severity || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const incident = await prisma.incident.create({
            data: {
                type,
                severity,
                description,
                tripLogId: tripLogId || null,
                reportedById: (driver as any).id,
            },
        });

        // Notify Admins for high severity incidents
        if (severity === "HIGH" || severity === "CRITICAL") {
            try {
                await sendToRole(
                    "ADMIN",
                    `${severity} Incident Reported`,
                    `Driver ${driver.name} reported a ${type} issue: ${description.slice(0, 50)}...`,
                    (driver as any).id
                );
            } catch (notifyErr) {
                console.error("Failed to send notification for incident:", notifyErr);
                // Don't fail the whole request if notification fails
            }
        }

        return NextResponse.json({ incident }, { status: 201 });
    } catch (err) {
        console.error("Failed to create incident:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
