import { adminMessaging } from "./firebase-admin";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

interface SendResult {
    successCount: number;
    failureCount: number;
}

async function getTokensForUser(userId: string): Promise<string[]> {
    const rows = await prisma.fcmToken.findMany({ where: { userId }, select: { token: true } });
    return rows.map((r) => r.token);
}

async function getTokensForRole(role: Role): Promise<string[]> {
    const rows = await prisma.fcmToken.findMany({
        where: { user: { role } },
        select: { token: true },
    });
    return rows.map((r) => r.token);
}

async function getAllTokens(): Promise<string[]> {
    const rows = await prisma.fcmToken.findMany({ select: { token: true } });
    return rows.map((r) => r.token);
}

async function dispatchMulticast(
    tokens: string[],
    title: string,
    body: string
): Promise<SendResult> {
    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    // FCM allows max 500 tokens per call — chunk if needed
    const CHUNK = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokens.length; i += CHUNK) {
        const chunk = tokens.slice(i, i + CHUNK);
        const response = await adminMessaging.sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
            webpush: {
                notification: { title, body, icon: "/favicon.ico" },
                fcmOptions: { link: "/dashboard" },
            },
        });
        successCount += response.successCount;
        failureCount += response.failureCount;

        // Remove invalid tokens
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (
                !resp.success &&
                (resp.error?.code === "messaging/registration-token-not-registered" ||
                    resp.error?.code === "messaging/invalid-registration-token")
            ) {
                invalidTokens.push(chunk[idx]);
            }
        });
        if (invalidTokens.length > 0) {
            await prisma.fcmToken.deleteMany({ where: { token: { in: invalidTokens } } });
        }
    }

    return { successCount, failureCount };
}

export async function sendToUser(
    userId: string,
    title: string,
    body: string,
    sentById: string
): Promise<SendResult> {
    const tokens = await getTokensForUser(userId);
    const result = await dispatchMulticast(tokens, title, body);
    await prisma.notification.create({
        data: {
            title,
            body,
            targetType: "USER",
            targetValue: userId,
            successCount: result.successCount,
            failureCount: result.failureCount,
            sentById,
        },
    });
    return result;
}

export async function sendToRole(
    role: Role,
    title: string,
    body: string,
    sentById: string
): Promise<SendResult> {
    const tokens = await getTokensForRole(role);
    const result = await dispatchMulticast(tokens, title, body);
    await prisma.notification.create({
        data: {
            title,
            body,
            targetType: "ROLE",
            targetValue: role,
            successCount: result.successCount,
            failureCount: result.failureCount,
            sentById,
        },
    });
    return result;
}

export async function sendToAll(
    title: string,
    body: string,
    sentById: string
): Promise<SendResult> {
    const tokens = await getAllTokens();
    const result = await dispatchMulticast(tokens, title, body);
    await prisma.notification.create({
        data: {
            title,
            body,
            targetType: "ALL",
            targetValue: null,
            successCount: result.successCount,
            failureCount: result.failureCount,
            sentById,
        },
    });
    return result;
}
