
import { prisma } from "@/lib/prisma";

export async function createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    changesBefore,
    changesAfter,
    ipAddress,
    userAgent,
}: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    changesBefore?: any;
    changesAfter?: any;
    ipAddress: string;
    userAgent: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resourceType,
                resourceId,
                changesBefore: changesBefore ? JSON.stringify(changesBefore) : undefined,
                changesAfter: changesAfter ? JSON.stringify(changesAfter) : undefined,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw, we don't want to block the main action if logging fails
    }
}
