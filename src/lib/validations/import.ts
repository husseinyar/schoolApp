
import { z } from "zod";

export const studentImportSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dateOfBirth: z.string().min(1, "Date of Birth is required (YYYY-MM-DD)"),
    grade: z.coerce.number().optional().default(0), // Coerce string to number
    schoolId: z.string().min(1, "School ID is required"),
    parentId: z.string().optional(),
    // Address fields
    addressStreet: z.string().min(1, "Street address is required"),
    addressPostal: z.string().min(1, "Postal code is required"),
    addressCity: z.string().min(1, "City is required"),
    latitude: z.coerce.number().default(0),
    longitude: z.coerce.number().default(0),
});

export type StudentImportRow = z.infer<typeof studentImportSchema>;

export type ImportError = {
    row: number;
    field: string;
    message: string;
};

export type ImportStats = {
    total: number;
    valid: number;
    invalid: number;
};
