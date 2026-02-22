
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuditLog } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
    logs: (AuditLog & {
        user: { name: string; email: string };
    })[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    You made {logs.length} actions this session.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                {/* <AvatarImage src="/avatars/01.png" alt="Avatar" /> */}
                                <AvatarFallback>{log.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {log.user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {log.action} {log.resourceType} ({log.resourceId.slice(0, 8)}...)
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent activity found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
