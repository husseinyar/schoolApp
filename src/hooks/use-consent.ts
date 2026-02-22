import { useState, useEffect } from "react";
import { ConsentType, Consent } from "@prisma/client";
import { useSession } from "next-auth/react";

export type ConsentState = Record<ConsentType, boolean>;

const REQUIRED_CONSENTS = [
    ConsentType.DATA_PROCESSING,
];

const ALL_CONSENTS = Object.values(ConsentType);

export function useConsent() {
    const { data: session, status } = useSession();
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [consents, setConsents] = useState<ConsentState>(
        ALL_CONSENTS.reduce((acc, type) => ({ ...acc, [type]: false }), {} as ConsentState)
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") {
            setIsLoading(false);
            return;
        }

        const checkConsents = async () => {
            try {
                const res = await fetch("/api/consent");
                if (!res.ok) throw new Error("Failed to fetch consents");

                const data = await res.json();
                const userConsents: Consent[] = data.consents;

                // Map latest decisions
                const currentConsents = { ...consents };

                // Group by type and find latest
                const latestByType = new Map<ConsentType, Consent>();
                userConsents.forEach(c => {
                    if (!latestByType.has(c.type)) {
                        latestByType.set(c.type, c);
                    } else {
                        const existing = latestByType.get(c.type)!;
                        if (new Date(c.grantedAt) > new Date(existing.grantedAt)) {
                            latestByType.set(c.type, c);
                        }
                    }
                });

                latestByType.forEach((c, type) => {
                    currentConsents[type] = c.granted;
                });

                setConsents(currentConsents);

                // Check if required consents are missing or false
                const missingRequired = REQUIRED_CONSENTS.some(
                    type => !latestByType.has(type) || !latestByType.get(type)?.granted
                );

                if (missingRequired) {
                    setShowConsentModal(true);
                }

            } catch (error) {
                console.error("Error checking consents:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkConsents();
    }, [status, session]);

    const saveConsents = async (newConsents: ConsentState) => {
        try {
            setIsLoading(true);
            const payload = {
                consents: Object.entries(newConsents).map(([type, granted]) => ({
                    type,
                    granted
                })),
                userAgent: navigator.userAgent
            };

            const res = await fetch("/api/consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save consents");

            setConsents(newConsents);
            setShowConsentModal(false);
            return true;
        } catch (error) {
            console.error("Failed to save consents", error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        showConsentModal,
        consents,
        isLoading,
        saveConsents,
        requiredConsents: REQUIRED_CONSENTS
    };
}
