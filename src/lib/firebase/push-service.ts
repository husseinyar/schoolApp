import { adminMessaging } from "./firebase-admin";

export async function sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
) {
    if (tokens.length === 0) return;

    const message = {
        notification: {
            title,
            body,
        },
        data: data || {},
        tokens: tokens,
    };

    try {
        const response = await adminMessaging.sendEachForMulticast(message);
        console.log(
            `[PUSH] Sent ${response.successCount} messages; ${response.failureCount} failed.`
        );
        return response;
    } catch (error) {
        console.error("[PUSH] Error sending message:", error);
        throw error;
    }
}

export async function sendProximityAlert(
    tokens: string[],
    studentName: string,
    stopName: string,
    distanceMeters: number
) {
    const title = "Bus Nearby! 🚌";
    const body = `The bus is approaching ${stopName}. Please have ${studentName} ready!`;

    return sendPushNotification(tokens, title, body, {
        type: "PROXIMITY_ALERT",
        studentName,
        stopName,
    });
}
