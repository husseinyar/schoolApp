"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "next-auth/react";
import {
    User, Shield, Bell, Eye, EyeOff, CheckCircle2, AlertCircle,
    Smartphone, Mail, MessageSquare, BellOff, Clock, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

// ── Schemas ──────────────────────────────────────────────────────────────────

const accountSchema = z.object({
    name: z.string().min(2, "At least 2 characters"),
    phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone number").optional().or(z.literal("")),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Required"),
        newPassword: z
            .string()
            .min(8, "Minimum 8 characters")
            .regex(/[A-Z]/, "Must include uppercase")
            .regex(/[0-9]/, "Must include number"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type AccountFormData = z.infer<typeof accountSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Default settings ──────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    absenceAlerts: true,
    routeDelayAlerts: true,
};

// ── Inline message helper ─────────────────────────────────────────────────────

function Msg({ result }: { result: { type: "success" | "error"; text: string } | null }) {
    if (!result) return null;
    return (
        <span className={cn("text-sm flex items-center gap-1.5 animate-in fade-in",
            result.type === "success" ? "text-emerald-500" : "text-destructive")}>
            {result.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {result.text}
        </span>
    );
}

// ── Password strength ─────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: "8+ chars", pass: password.length >= 8 },
        { label: "Uppercase", pass: /[A-Z]/.test(password) },
        { label: "Number", pass: /[0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.pass).length;
    const barColor = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"][score];
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= score ? barColor : "bg-muted")} />
                ))}
            </div>
            <div className="flex gap-3 flex-wrap">
                {checks.map((c) => (
                    <span key={c.label} className={cn("text-xs flex items-center gap-1", c.pass ? "text-emerald-400" : "text-muted-foreground")}>
                        <CheckCircle2 className="h-3 w-3" /> {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ── Toggle Row ────────────────────────────────────────────────────────────────

function ToggleRow({ icon: Icon, label, description, id, checked, onCheckedChange, disabled }: {
    icon: React.ElementType; label: string; description: string; id: string;
    checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <Label htmlFor={id} className="font-medium cursor-pointer">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [accountMsg, setAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [accountSaving, setAccountSaving] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurPw, setShowCurPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const accountForm = useForm<AccountFormData>({ resolver: zodResolver(accountSchema) as any });
    const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) as any });

    // ── Load profile + settings ────────────────────────────────────────────────

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((j) => {
                if (j.success) {
                    setProfile(j.data);
                    accountForm.reset({ name: j.data.name, phone: j.data.phone ?? "" });
                    if (j.data.settings) {
                        setSettings({ ...DEFAULT_SETTINGS, ...j.data.settings });
                    }
                }
            });
    }, []);

    // ── Account save ──────────────────────────────────────────────────────────

    async function onAccountSave(values: AccountFormData) {
        setAccountSaving(true);
        setAccountMsg(null);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: values.name, phone: values.phone || null }),
            });
            const json = await res.json();
            if (res.ok) {
                await updateSession({ name: json.data.name });
                setAccountMsg({ type: "success", text: "Saved!" });
            } else {
                setAccountMsg({ type: "error", text: json.error ?? "Save failed" });
            }
        } catch {
            setAccountMsg({ type: "error", text: "Unexpected error" });
        } finally {
            setAccountSaving(false);
        }
    }

    // ── Notification toggle ────────────────────────────────────────────────────

    async function onToggle(key: keyof typeof DEFAULT_SETTINGS, value: boolean) {
        const next = { ...settings, [key]: value };
        setSettings(next);
        setSettingsSaving(true);
        try {
            await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: next }),
            });
        } finally {
            setSettingsSaving(false);
        }
    }

    // ── Password save ─────────────────────────────────────────────────────────

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
            if (res.ok) {
                passwordForm.reset();
                setPwMsg({ type: "success", text: "Password changed!" });
            } else {
                setPwMsg({ type: "error", text: json.error ?? "Failed" });
            }
        } catch {
            setPwMsg({ type: "error", text: "Unexpected error" });
        } finally {
            setPwSaving(false);
        }
    }

    const newPw = passwordForm.watch("newPassword") ?? "";

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm">Manage your account preferences and security.</p>
            </div>

            <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="account" className="flex items-center gap-1.5"><User className="h-4 w-4" /> Account</TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-1.5"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                </TabsList>

                {/* ── Account Tab ── */}
                <TabsContent value="account">
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
                        <div>
                            <h3 className="font-semibold">Personal Details</h3>
                            <p className="text-sm text-muted-foreground">Your public display name and contact number.</p>
                        </div>
                        <Separator />
                        <form onSubmit={accountForm.handleSubmit(onAccountSave)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="st-name">Full Name</Label>
                                    <Input id="st-name" {...accountForm.register("name")} />
                                    {accountForm.formState.errors.name && (
                                        <p className="text-xs text-destructive">{accountForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="st-phone">Phone Number</Label>
                                    <Input id="st-phone" type="tel" placeholder="+46 70 123 4567" {...accountForm.register("phone")} />
                                    {accountForm.formState.errors.phone && (
                                        <p className="text-xs text-destructive">{accountForm.formState.errors.phone.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <Msg result={accountMsg} />
                                <Button type="submit" disabled={accountSaving} size="sm" className="ml-auto">
                                    {accountSaving ? "Saving…" : "Save Changes"}
                                </Button>
                            </div>
                        </form>

                        <Separator />

                        {/* Read-only info */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-medium">{profile?.email ?? "…"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-medium">{profile?.role ?? "…"}</span>
                            </div>
                            {profile?.school && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">School</span>
                                    <span className="font-medium">{profile.school.name}</span>
                                </div>
                            )}
                            {profile?.lastLoginAt && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last login</span>
                                    <span className="font-medium text-xs">{new Date(profile.lastLoginAt).toLocaleString("en-SE")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ── Notifications Tab ── */}
                <TabsContent value="notifications">
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-1">
                        <div className="mb-4">
                            <h3 className="font-semibold">Notification Preferences</h3>
                            <p className="text-sm text-muted-foreground">Choose how you want to be notified. {settingsSaving && <span className="text-primary">Saving…</span>}</p>
                        </div>
                        <Separator className="mb-2" />

                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium py-2">Channels</p>
                        <ToggleRow icon={Mail} id="email-notif" label="Email Notifications" description="Receive updates via email" checked={settings.emailNotifications} onCheckedChange={(v) => onToggle("emailNotifications", v)} />
                        <Separator />
                        <ToggleRow icon={Smartphone} id="push-notif" label="Push Notifications" description="Receive push alerts on your device" checked={settings.pushNotifications} onCheckedChange={(v) => onToggle("pushNotifications", v)} />
                        <Separator />
                        <ToggleRow icon={MessageSquare} id="sms-notif" label="SMS Notifications" description="Receive text messages for critical alerts" checked={settings.smsNotifications} onCheckedChange={(v) => onToggle("smsNotifications", v)} />

                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium pt-4 pb-2">Alert Types</p>
                        <ToggleRow icon={BellOff} id="absence-alerts" label="Absence Alerts" description="Get notified when an absence is reported" checked={settings.absenceAlerts} onCheckedChange={(v) => onToggle("absenceAlerts", v)} />
                        <Separator />
                        <ToggleRow icon={Clock} id="delay-alerts" label="Route Delay Alerts" description="Get notified when a bus is delayed" checked={settings.routeDelayAlerts} onCheckedChange={(v) => onToggle("routeDelayAlerts", v)} />
                    </div>
                </TabsContent>

                {/* ── Security Tab ── */}
                <TabsContent value="security">
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
                        <div>
                            <h3 className="font-semibold">Change Password</h3>
                            <p className="text-sm text-muted-foreground">Minimum 8 characters, 1 uppercase, 1 number.</p>
                        </div>
                        <Separator />
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sec-cur">Current Password</Label>
                                <div className="relative">
                                    <Input id="sec-cur" type={showCurPw ? "text" : "password"} {...passwordForm.register("currentPassword")} className="pr-10" />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurPw((v) => !v)}>
                                        {showCurPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {passwordForm.formState.errors.currentPassword && (
                                    <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sec-new">New Password</Label>
                                <div className="relative">
                                    <Input id="sec-new" type={showNewPw ? "text" : "password"} {...passwordForm.register("newPassword")} className="pr-10" />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPw((v) => !v)}>
                                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <PasswordStrength password={newPw} />
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sec-conf">Confirm New Password</Label>
                                <Input id="sec-conf" type="password" {...passwordForm.register("confirmPassword")} />
                                {passwordForm.formState.errors.confirmPassword && (
                                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <Msg result={pwMsg} />
                                <Button type="submit" disabled={pwSaving} size="sm" className="ml-auto">
                                    {pwSaving ? "Changing…" : "Change Password"}
                                </Button>
                            </div>
                        </form>

                        <Separator />

                        {/* Session */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Session</h4>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Current session</p>
                                    <p className="text-xs text-muted-foreground">Signed in as {session?.user?.email}</p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                                >
                                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
