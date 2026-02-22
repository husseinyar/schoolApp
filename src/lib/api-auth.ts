import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";

export async function ensureRole(allowedRoles: Role[]) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return {
            authorized: false,
            response: new NextResponse("Unauthorized", { status: 401 }),
            user: null,
        };
    }

    if (!hasRole(session.user.role, allowedRoles)) {
        return {
            authorized: false,
            response: new NextResponse("Forbidden", { status: 403 }),
            user: session.user,
        };
    }

    return {
        authorized: true,
        response: null,
        user: session.user,
    };
}
