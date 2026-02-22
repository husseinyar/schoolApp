
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, AlertCircle, CheckCircle2, Download, History, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImportError, ImportStats } from "@/lib/validations/import";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["text/csv", "application/vnd.ms-excel"];

const formSchema = z.object({
  file: z.custom<FileList>()
    .refine((files) => files?.length === 1, "File is required")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Max file size is 5MB")
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only CSV files are accepted"
    ),
});

type ImportJob = {
    id: string;
    filename: string;
    status: string;
    total: number;
    success: number;
    failed: number;
    createdAt: string;
};

const ImportStudentsPage = () => {
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "complete">("upload");
  const [stats, setStats] = useState<ImportStats>({ total: 0, valid: 0, invalid: 0 });
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [validData, setValidData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportJob[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors: formErrors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const fetchHistory = async () => {
      try {
          const res = await fetch("/api/students/import/history");
          if (res.ok) {
              const data = await res.json();
              setHistory(data);
          }
      } catch (e) {
          console.error("Failed to fetch history", e);
      }
  };

  useEffect(() => {
      fetchHistory();
  }, [step]); // Refresh history when step changes (e.g. after complete)

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setStep("processing");
    setErrorMessage(null);
    const file = data.file[0];
    setUploadedFileName(file.name);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/students/import/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
         throw new Error(errorText || "Validation failed");
      }

      const result = await response.json();
      setValidData(result.data);
      setErrors(result.errors);
      setStats(result.stats);
      setStep("preview");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setStep("upload");
    }
  };

  const handleCommit = async () => {
    setStep("processing");
    setErrorMessage(null);
    try {
        const response = await fetch("/api/students/import/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                students: validData,
                filename: uploadedFileName
            })
        });
        
        if (!response.ok) throw new Error("Commit failed");
        
        setStep("complete");
    } catch (error) {
       console.error(error);
       setErrorMessage("Import failed. Please try again.");
       setStep("preview");
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Import Students</h1>
          <Button variant="outline" asChild>
              <a href="/api/students/import/template" download="students_template.csv">
                  <Download className="mr-2 h-4 w-4" /> Download Template
              </a>
          </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
              Upload a CSV file containing student data. Ensure the columns match the template.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {errorMessage && (
               <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                   <AlertCircle className="w-5 h-5 mr-2" />
                   {errorMessage}
               </div>
           )}

           {step === "upload" && (
               <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                   <div className="grid w-full max-w-sm items-center gap-1.5">
                       <Label htmlFor="csv">Select File</Label>
                       <Input id="csv" type="file" {...register("file")} accept=".csv, .txt" />
                       {formErrors.file && <p className="text-red-500 text-sm">{formErrors.file?.message as string}</p>}
                   </div>
                   <Button type="submit">
                       <Upload className="mr-2 h-4 w-4" /> Upload & Validate
                   </Button>
               </form>
           )}

           {step === "preview" && (
               <div className="space-y-6">
                   <div className="bg-blue-50 p-4 rounded-md flex justify-between text-sm">
                       <span>Total Rows: <strong>{stats?.total}</strong></span>
                       <span className="text-green-600">Valid: <strong>{stats?.valid}</strong></span>
                       <span className="text-red-600">Invalid: <strong>{stats?.invalid}</strong></span>
                   </div>
                   
                   {errors.length > 0 ? (
                       <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
                           <h4 className="font-semibold text-red-800 mb-2 text-sm">Errors</h4>
                           <ul className="space-y-1 text-xs text-red-700">
                               {errors.map((err, i) => (
                                   <li key={i}>Row {err.row}: {err.message} ({err.field})</li>
                               ))}
                           </ul>
                       </div>
                   ) : (
                       <div className="bg-green-50 p-4 text-green-700 rounded-md flex items-center">
                           <CheckCircle2 className="w-5 h-5 mr-2" />
                           All {stats?.valid} rows look good!
                       </div>
                   )}
                   
                   <div className="flex justify-end space-x-2">
                       <Button variant="outline" onClick={() => setStep("upload")}>Cancel</Button>
                       <Button onClick={handleCommit} disabled={stats?.valid === 0}>
                           Import {stats?.valid} Students
                       </Button>
                   </div>
               </div>
           )}
           
           {step === "processing" && (
               <div className="flex flex-col items-center justify-center py-10 space-y-4">
                   <Loader2 className="h-10 w-10 animate-spin text-primary" />
                   <p className="text-muted-foreground text-sm">Processing...</p>
               </div>
           )}

           {step === "complete" && (
               <div className="text-center py-10 space-y-4">
                   <div className="flex justify-center">
                       <CheckCircle2 className="h-16 w-16 text-green-500" />
                   </div>
                   <h3 className="text-xl font-semibold">Import Successful!</h3>
                   <p className="text-muted-foreground">Successfully imported {stats?.valid} students.</p>
                   <Button onClick={() => { setStep("upload"); setValidData([]); setStats({total: 0, valid: 0, invalid: 0}); }}>Import More</Button>
               </div>
           )}

        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" /> Import History
              </CardTitle>
          </CardHeader>
          <CardContent>
              {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No imports yet.</p>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>File</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Stats</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {history.map((job) => (
                              <TableRow key={job.id}>
                                  <TableCell className="text-xs">
                                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                  </TableCell>
                                  <TableCell className="flex items-center gap-2">
                                      <FileText className="w-3 h-3 text-muted-foreground" />
                                      {job.filename}
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant={job.status === "COMPLETED" ? "default" : "destructive"}>
                                          {job.status}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                      {job.success} success, {job.failed} failed
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              )}
          </CardContent>
      </Card>
    </div>
  );
}

export default ImportStudentsPage;
