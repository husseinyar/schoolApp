import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ConsentType } from "@prisma/client";
import { CURRENT_CONSENT_VERSION } from "@/lib/config";
import { createAuditLog } from "@/lib/audit";

// Schema for input validation
const consentSchema = z.object({
    consents: z.array(
        z.object({
            type: z.nativeEnum(ConsentType),
            granted: z.boolean(),
        })
    ),
    userAgent: z.string(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { consents, userAgent } = consentSchema.parse(body);
        const ipAddress = req.headers.get("x-forwarded-for") || "unknown";

        // Use a transaction to create multiple consent records
        const createdConsents = await prisma.$transaction(
            consents.map((consent) =>
                prisma.consent.create({
                    data: {
                        userId: session.user.id,
                        type: consent.type,
                        granted: consent.granted,
                        grantedAt: new Date(),
                        ipAddress, // In a real app, hash this
                        userAgent,
                        version: CURRENT_CONSENT_VERSION,
                    },
                })
            )
        );

        // Audit Log (Fire and forget, or await if critical)
        // Since we modify user settings, let's log it.
        // We log one entry for the batch update for simplicity, or one per type? 
        // A batch update log is cleaner.
        // Audit Log
        await createAuditLog({
            userId: session.user.id,
            action: "update",
            resourceType: "consent",
            resourceId: session.user.id,
            changesAfter: consents,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Consent API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch the LATEST consent decision for each type for this user
        // Since we store history, we need to be careful.
        // Ideally, we group by type and get max grantedAt, or just fetch all and reduce in code.
        // For simplicity/performance with simple SQL, fetching all for user is usually fine if history is small.
        // Or we just check if they have ANY record for the required types.

        // Simplest check: Get all consents for user
        const consents = await prisma.consent.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                grantedAt: "desc",
            },
        });

        return NextResponse.json({ consents });
    } catch (error) {
        console.error("Consent API Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
