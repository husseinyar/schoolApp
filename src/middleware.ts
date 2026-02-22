import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Role → home portal mapping
function homeForRole(role: string | undefined): string {
    if (role === "DRIVER") return "/driver";
    if (role === "PARENT") return "/parent";
    return "/dashboard"; // ADMIN or unknown
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role as string | undefined;
        const home = homeForRole(role);

        // ── /dashboard — ADMIN only ──────────────────────────────
        if (path.startsWith("/dashboard") && role !== "ADMIN") {
            return NextResponse.redirect(new URL(home, req.url));
        }

        // ── /admin — ADMIN only ──────────────────────────────────
        if (path.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL(home, req.url));
        }

        // ── /driver — DRIVER only ────────────────────────────────
        if (path.startsWith("/driver") && role !== "DRIVER") {
            return NextResponse.redirect(new URL(home, req.url));
        }

        // ── /parent — PARENT only ────────────────────────────────
        if (path.startsWith("/parent") && role !== "PARENT") {
            return NextResponse.redirect(new URL(home, req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/signin",
        },
    }
);

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/admin/:path*",
        "/driver/:path*",
        "/parent/:path*",
        "/api/consent/:path*",
    ],
};
