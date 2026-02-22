
import { NextResponse } from "next/server";

export async function GET() {
    const csvContent =
        `name,dateOfBirth,grade,schoolId,parentId,addressStreet,addressPostal,addressCity,latitude,longitude
John Doe,2015-05-20,3,SCH-123,USR-456,123 Main St,12345,New York,40.7128,-74.0060`;

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=students_template.csv",
        },
    });
}
