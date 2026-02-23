"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Mail, Phone, Calendar, Building2, Shield,
    Clock, Settings, MapPin, Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    DRIVER: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    PARENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    STUDENT: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

const ROLE_BG: Record<string, string> = {
    ADMIN: "from-violet-600 to-violet-400",
    DRIVER: "from-blue-600 to-blue-400",
    PARENT: "from-emerald-600 to-emerald-400",
    STUDENT: "from-amber-600 to-amber-400",
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="p-1.5 rounded-md bg-muted mt-0.5 shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((j) => j.success && setProfile(j.data))
            .finally(() => setLoading(false));
    }, []);

    const role = profile?.role ?? "";

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

            {/* ── Hero Card ── */}
            <div className={cn(
                "relative overflow-hidden rounded-2xl p-8",
                "bg-gradient-to-br from-primary/10 via-background to-background border border-border/60"
            )}>
                {/* Decorative blob */}
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar */}
                    <div className={cn(
                        "h-24 w-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shrink-0 bg-gradient-to-br",
                        ROLE_BG[role] ?? "from-primary to-primary/60"
                    )}>
                        {loading ? "…" : getInitials(profile?.name)}
                    </div>

                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <h1 className="text-3xl font-bold truncate">
                            {loading ? "Loading…" : (profile?.name ?? "—")}
                        </h1>

                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
                            {role && (
                                <span className={cn(
                                    "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                                    ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"
                                )}>
                                    {role}
                                </span>
                            )}
                            {profile?.school?.name && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> {profile.school.name}
                                </span>
                            )}
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                </div>
            </div>

            {/* ── Details Card ── */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Account Details
                </h2>
                <Separator className="mb-2" />

                <div className="divide-y divide-border/50">
                    <InfoRow icon={Mail} label="Email address" value={profile?.email} />
                    <InfoRow icon={Phone} label="Phone number" value={profile?.phone ?? "Not set"} />
                    <InfoRow icon={Shield} label="Role" value={role} />
                    <InfoRow icon={Building2} label="School" value={profile?.school?.name} />
                    <InfoRow
                        icon={Calendar}
                        label="Member since"
                        value={
                            profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-SE", {
                                    year: "numeric", month: "long", day: "numeric",
                                })
                                : undefined
                        }
                    />
                    <InfoRow
                        icon={Clock}
                        label="Last login"
                        value={
                            profile?.lastLoginAt
                                ? new Date(profile.lastLoginAt).toLocaleString("en-SE")
                                : "Never"
                        }
                    />
                    {/* Driver: show assigned routes */}
                    {profile?.routes?.length > 0 && (
                        <div className="flex items-start gap-3 py-3">
                            <div className="p-1.5 rounded-md bg-muted mt-0.5 shrink-0">
                                <Bus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Assigned Routes</p>
                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                    {profile.routes.map((r: any) => (
                                        <span key={r.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                            {r.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CTA ── */}
            <div className="flex justify-end">
                <Button asChild className="gap-2">
                    <Link href="/settings">
                        <Settings className="h-4 w-4" />
                        Edit in Settings
                    </Link>
                </Button>
            </div>
        </div>
    );
}
