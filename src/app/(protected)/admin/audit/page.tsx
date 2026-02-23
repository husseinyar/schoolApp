
"use client";

import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  userId: string;
  user: { name: string; email: string };
  action: string;
  resourceType: string;
  resourceId: string;
  changesAfter?: string;
  timestamp: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchLogs(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${p}&limit=20`);
      const json = await res.json();
      setLogs(json.data);
      setTotalPages(json.totalPages);
      setPage(json.page);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p>Loading...</p>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant={log.action === 'delete' ? 'destructive' : 'outline'}>
                         {log.action.toUpperCase()}
                       </Badge>
                    </TableCell>
                    <TableCell>
                        {log.resourceType}: {log.resourceId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                        {/* Expandable details or modal would go here */}
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                            {log.changesAfter || "-"}
                        </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-between items-center mt-4">
                <Button 
                    variant="outline" 
                    onClick={() => fetchLogs(page - 1)} 
                    disabled={page <= 1}
                >
                    Previous
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button 
                    variant="outline" 
                    onClick={() => fetchLogs(page + 1)} 
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
