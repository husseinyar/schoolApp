
export interface EmailProvider {
    sendEmail(to: string, subject: string, html: string): Promise<void>;
}

export class MockEmailProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        console.log("---------------------------------------------------");
        console.log(`[MockEmailProvider] Sending Email to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body (HTML length): ${html.length} chars`);
        console.log("---------------------------------------------------");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Future: ResendEmailProvider
// export class ResendEmailProvider implements EmailProvider { ... }

export function getEmailProvider(): EmailProvider {
    const providerType = process.env.EMAIL_PROVIDER || "mock";

    if (providerType === "mock") {
        return new MockEmailProvider();
    }

    // if (providerType === "resend") return new ResendEmailProvider();

    console.warn(`Unknown email provider '${providerType}', falling back to mock.`);
    return new MockEmailProvider();
}

export const emailService = getEmailProvider();
