"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useConsent, ConsentState } from "@/hooks/use-consent";
import { ConsentType } from "@prisma/client";

const CONSENT_DESCRIPTIONS: Record<ConsentType, string> = {
  DATA_PROCESSING: "Allow us to process your personal data for service delivery (Required).",
  LOCATION_TRACKING: "Allow tracking of student location during transit.",
  PHOTO: "Allow student photos for identification purposes.",
  MEDICAL_INFO: "Allow storage of critical medical information.",
  MARKETING: "Receive updates about new features and school announcements.",
};

export function ConsentModal() {
  const { showConsentModal, saveConsents, isLoading } = useConsent();
  const [selectedConsents, setSelectedConsents] = useState<ConsentState>({} as ConsentState);

  // Initialize state
  useEffect(() => {
    const initial = Object.values(ConsentType).reduce((acc, type) => ({
      ...acc,
      [type]: type === ConsentType.DATA_PROCESSING // Default required to true? Or force user to click?
    }), {} as ConsentState);
    setSelectedConsents(initial);
  }, []);

  if (!showConsentModal) return null;

  const handleToggle = (type: ConsentType) => {
    setSelectedConsents(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = async () => {
    // Validation: Check required
    if (!selectedConsents[ConsentType.DATA_PROCESSING]) {
       alert("Data Processing consent is required to use this application.");
       return;
    }
    await saveConsents(selectedConsents);
  };

  return (
    <Dialog open={showConsentModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Data Privacy & Consent</DialogTitle>
          <DialogDescription>
            We need your permission to process certain data to provide our school bus tracking services.
            Please review the options below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {Object.values(ConsentType).map((type) => (
            <div key={type} className="flex items-start space-x-3 space-y-0">
              <Checkbox 
                id={type} 
                checked={selectedConsents[type] || false}
                onCheckedChange={() => handleToggle(type)}
                disabled={type === ConsentType.DATA_PROCESSING} // Force required?
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={type}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type.replace(/_/g, " ")} {type === ConsentType.DATA_PROCESSING && "(Required)"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {CONSENT_DESCRIPTIONS[type]}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Confirm Choices"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
