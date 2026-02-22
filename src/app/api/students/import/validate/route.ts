
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { studentImportSchema, ImportError, ImportStats } from "@/lib/validations/import";
import Papa from "papaparse";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const fileContent = await file.text();

        // Parse CSV
        const { data, errors: parseErrors } = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseErrors.length > 0) {
            return NextResponse.json({
                success: false,
                message: "CSV parsing failed",
                errors: parseErrors.map(e => ({ row: e.row, message: e.message }))
            }, { status: 400 });
        }

        const validRows: z.infer<typeof studentImportSchema>[] = [];
        const validationErrors: ImportError[] = [];
        let stats: ImportStats = { total: data.length, valid: 0, invalid: 0 };

        // Validate rows
        (data as any[]).forEach((row, index) => {
            // Map CSV to Schema (handle type conversions if needed)
            // For now assume direct mapping or simple coercion
            const rowToValidate = {
                ...row,
                // Coerce lat/lng to numbers if present
                latitude: row.latitude ? parseFloat(row.latitude) : undefined,
                longitude: row.longitude ? parseFloat(row.longitude) : undefined,
            };

            const result = studentImportSchema.safeParse(rowToValidate);

            if (result.success) {
                validRows.push(result.data);
                stats.valid++;
            } else {
                stats.invalid++;
                result.error.issues.forEach(err => {
                    validationErrors.push({
                        row: index + 2, // Account for header + 0-index
                        field: err.path.join("."),
                        message: err.message
                    });
                });
            }
        });

        return NextResponse.json({
            success: true,
            data: validRows,
            errors: validationErrors,
            stats
        });

    } catch (error) {
        console.error("Import validation error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
