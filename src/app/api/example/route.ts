
import { apiHandler, successResponse, ApiError } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    return apiHandler(async () => {
        const { searchParams } = new URL(req.url);
        const error = searchParams.get("error");

        if (error === "true") {
            throw new ApiError("This is a simulated error", 400, "SIMULATED_ERROR");
        }

        return successResponse({
            message: "This is a success response",
            timestamp: new Date().toISOString(),
        });
    });
}
