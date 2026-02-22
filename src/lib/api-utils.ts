
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 400, code: string = "API_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}

export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        { status }
    );
}

export function errorResponse(
    message: string,
    status: number = 400,
    code: string = "UNKNOWN_ERROR",
    details?: any
): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
                code,
                details,
            },
        },
        { status }
    );
}

export type ApiHandler = () => Promise<NextResponse>;

export async function apiHandler(handler: ApiHandler): Promise<NextResponse> {
    try {
        return await handler();
    } catch (error: any) {
        console.error("API Error:", error);

        if (error instanceof ApiError) {
            return errorResponse(error.message, error.statusCode, error.code);
        }

        if (error instanceof ZodError) {
            return errorResponse("Validation error", 400, "VALIDATION_ERROR", error.issues);
        }

        // Handle Prisma Errors (simplified)
        if (error.code && error.code.startsWith("P")) {
            return errorResponse("Database error", 500, `DB_ERROR_${error.code}`);
        }

        return errorResponse("Internal Server Error", 500, "INTERNAL_SERVER_ERROR");
    }
}
