"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Shield, Phone, Mail, Calendar, Building2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    name: z.string().min(2, "At least 2 characters"),
    phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone number").optional().or(z.literal("")),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Required"),
        newPassword: z
            .string()
            .min(8, "Minimum 8 characters")
            .regex(/[A-Z]/, "Must contain an uppercase letter")
            .regex(/[0-9]/, "Must contain a number"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    DRIVER: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    PARENT: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    STUDENT: "bg-amber-500/20 text-amber-300 border-amber-500/40",
};

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: "8+ characters", pass: password.length >= 8 },
        { label: "Uppercase", pass: /[A-Z]/.test(password) },
        { label: "Number", pass: /[0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.pass).length;
    const label = ["", "Weak", "Fair", "Strong"][score];
    const color = ["", "text-red-400", "text-amber-400", "text-emerald-400"][score];
    const barColor = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"][score];

    if (!password) return null;
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", i <= score ? barColor : "bg-muted")} />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", color)}>{label}</span>
                <div className="flex gap-3">
                    {checks.map((c) => (
                        <span key={c.label} className={cn("text-xs flex items-center gap-1", c.pass ? "text-emerald-400" : "text-muted-foreground")}>
                            <CheckCircle2 className="h-3 w-3" /> {c.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) as any });
    const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) as any });

    // ── Fetch profile ──────────────────────────────────────────────────────────

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((j) => {
                if (j.success) {
                    setProfile(j.data);
                    profileForm.reset({ name: j.data.name, phone: j.data.phone ?? "" });
                }
            })
            .finally(() => setProfileLoading(false));
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    async function onProfileSave(values: ProfileFormData) {
        setProfileSaving(true);
        setProfileMsg(null);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: values.name, phone: values.phone || null }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setProfile((p: any) => ({ ...p, name: json.data.name, phone: json.data.phone }));
                await updateSession({ name: json.data.name }); // sync NextAuth session
                setProfileMsg({ type: "success", text: "Profile updated successfully!" });
            } else {
                setProfileMsg({ type: "error", text: json.error ?? "Update failed" });
            }
        } catch {
            setProfileMsg({ type: "error", text: "Unexpected error. Try again." });
        } finally {
            setProfileSaving(false);
        }
    }

    async function onPasswordSave(values: PasswordFormData) {
        setPwSaving(true);
        setPwMsg(null);
        try {
            const res = await fetch("/api/profile/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                passwordForm.reset();
                setPwMsg({ type: "success", text: "Password changed successfully!" });
            } else {
                setPwMsg({ type: "error", text: json.error ?? "Change failed" });
            }
        } catch {
            setPwMsg({ type: "error", text: "Unexpected error. Try again." });
        } finally {
            setPwSaving(false);
        }
    }

    const newPw = passwordForm.watch("newPassword") ?? "";

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">

            {/* ── Hero Card ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-8">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <div className="relative flex items-start gap-6">
                    {/* Avatar */}
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg shrink-0">
                        {profileLoading ? "…" : getInitials(profile?.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h1 className="text-2xl font-bold truncate">{profileLoading ? "Loading…" : profile?.name}</h1>
                            {profile?.role && (
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", ROLE_COLORS[profile.role] ?? "bg-muted text-muted-foreground")}>
                                    {profile.role}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profile?.email}</div>
                            {profile?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {profile.phone}</div>}
                            {profile?.school && <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {profile.school.name}</div>}
                            {profile?.createdAt && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Member since {new Date(profile.createdAt).toLocaleDateString("en-SE", { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            )}
                            {profile?.lastLoginAt && (
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Last login: {new Date(profile.lastLoginAt).toLocaleString("en-SE")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Edit Profile ── */}
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Information</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Update your display name and contact number.</p>
                </div>
                <Separator />

                <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pf-name">Full Name</Label>
                            <Input id="pf-name" {...profileForm.register("name")} />
                            {profileForm.formState.errors.name && (
                                <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pf-phone">Phone Number</Label>
                            <Input id="pf-phone" type="tel" placeholder="+46 70 123 4567" {...profileForm.register("phone")} />
                            {profileForm.formState.errors.phone && (
                                <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {profileMsg && (
                            <span className={cn("text-sm flex items-center gap-1.5",
                                profileMsg.type === "success" ? "text-emerald-500" : "text-destructive")}>
                                {profileMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                {profileMsg.text}
                            </span>
                        )}
                        <Button type="submit" disabled={profileSaving} className="ml-auto">
                            {profileSaving ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* ── Change Password ── */}
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Change Password</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Use a strong password with uppercase letters and numbers.</p>
                </div>
                <Separator />

                <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="space-y-4">
                    {/* Current password */}
                    <div className="space-y-2">
                        <Label htmlFor="cur-pw">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="cur-pw"
                                type={showCurrentPw ? "text" : "password"}
                                {...passwordForm.register("currentPassword")}
                                className="pr-10"
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPw((v) => !v)}>
                                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                            <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                        )}
                    </div>

                    {/* New password */}
                    <div className="space-y-2">
                        <Label htmlFor="new-pw">New Password</Label>
                        <div className="relative">
                            <Input
                                id="new-pw"
                                type={showNewPw ? "text" : "password"}
                                {...passwordForm.register("newPassword")}
                                className="pr-10"
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw((v) => !v)}>
                                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <PasswordStrength password={newPw} />
                        {passwordForm.formState.errors.newPassword && (
                            <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                    </div>

                    {/* Confirm */}
                    <div className="space-y-2">
                        <Label htmlFor="conf-pw">Confirm New Password</Label>
                        <Input id="conf-pw" type="password" {...passwordForm.register("confirmPassword")} />
                        {passwordForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {pwMsg && (
                            <span className={cn("text-sm flex items-center gap-1.5",
                                pwMsg.type === "success" ? "text-emerald-500" : "text-destructive")}>
                                {pwMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                {pwMsg.text}
                            </span>
                        )}
                        <Button type="submit" disabled={pwSaving} className="ml-auto">
                            {pwSaving ? "Changing…" : "Change Password"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
