"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, Copy, RefreshCcw, ListChecks, FileSpreadsheet, Save, Trash2 } from "lucide-react";

type QuestionPoolItem = {
  id: string;
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  points: number;
  timeAllocationSeconds: number;
};

type QuestionPoolResponse = {
  questions: QuestionPoolItem[];
  categories: string[];
};

type ImportResponse = {
  created: number;
  skipped: number;
  totalRows: number;
  errors: Array<{ row: number; message: string }>;
};

type SavedPool = {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
  updatedAt: string;
};

type SavedPoolsResponse = {
  pools: SavedPool[];
};

type SavedPoolDetailResponse = {
  pool: {
    id: string;
    name: string;
    description: string | null;
    questionIds: string[];
  };
};

type CsvPreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
};

const CSV_TEMPLATE = [
  "question,options,correctAnswer,explanation,difficulty,type,category,tags,points,timeAllocationSeconds,challengeType",
  '"Which data structure uses FIFO?","Queue|Stack|Tree|Graph","Queue","Queue removes items in insertion order","easy","multiple_choice","Data Structures","arrays,basics",10,60,"quick_fire"',
].join("\n");

function parseCsvRecords(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentField.trim());
      const hasSomeValue = currentRow.some((value) => value.length > 0);
      if (hasSomeValue) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (inQuotes) {
    throw new Error("CSV appears malformed due to an unclosed quoted value.");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    const hasSomeValue = currentRow.some((value) => value.length > 0);
    if (hasSomeValue) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function buildCsvPreview(csvText: string): { headers: string[]; rows: CsvPreviewRow[] } {
  const records = parseCsvRecords(csvText);
  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].map((header) => header.trim()).filter(Boolean);
  const rows: CsvPreviewRow[] = records.slice(1).map((record, recordIndex) => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = (record[index] || "").trim();
    });

    return {
      rowNumber: recordIndex + 2,
      values,
    };
  });

  return { headers, rows };
}

export default function AdminQuestionSetsPage() {
  const { toast } = useToast();

  const [loadingPool, setLoadingPool] = useState(false);
  const [submittingImport, setSubmittingImport] = useState(false);
  const [questions, setQuestions] = useState<QuestionPoolItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importDifficulty, setImportDifficulty] = useState("medium");
  const [importType, setImportType] = useState("multiple_choice");
  const [importCategory, setImportCategory] = useState("General");
  const [importChallengeType, setImportChallengeType] = useState("quick_fire");
  const [importPoints, setImportPoints] = useState("10");
  const [importTimeAllocation, setImportTimeAllocation] = useState("60");
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [csvPreviewHeaders, setCsvPreviewHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [csvPreviewTotalRows, setCsvPreviewTotalRows] = useState(0);
  const [csvPreviewError, setCsvPreviewError] = useState<string | null>(null);
  const [savedPools, setSavedPools] = useState<SavedPool[]>([]);
  const [loadingSavedPools, setLoadingSavedPools] = useState(false);
  const [savingPool, setSavingPool] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [poolDescription, setPoolDescription] = useState("");

  const selectedCount = selectedIds.length;
  const selectedIdCsv = useMemo(() => selectedIds.join(","), [selectedIds]);
  const missingRequiredColumns = useMemo(() => {
    const normalizedHeaders = new Set(csvPreviewHeaders.map((header) => header.toLowerCase()));
    const requiredGroups = [
      ["question", "questiontext", "question_text"],
      ["correctanswer", "correct_answer", "expected_answer"],
    ];

    return requiredGroups
      .map((group) => (group.some((alias) => normalizedHeaders.has(alias)) ? null : group[0]))
      .filter((value): value is string => Boolean(value));
  }, [csvPreviewHeaders]);

  async function fetchQuestionPool() {
    try {
      setLoadingPool(true);
      const params = new URLSearchParams();
      params.set("limit", "150");
      if (search.trim()) params.set("search", search.trim());
      if (difficulty !== "all") params.set("difficulty", difficulty);
      if (category !== "all") params.set("category", category);

      const response = await fetch(`/api/contest/question-pool?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load question pool");
      }

      const data = (await response.json()) as QuestionPoolResponse;
      setQuestions(data.questions || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load question pool",
        description: "Please verify admin access and try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPool(false);
    }
  }

  async function fetchSavedPools() {
    try {
      setLoadingSavedPools(true);
      const response = await fetch("/api/contest/question-pools", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load saved pools");
      }

      const data = (await response.json()) as SavedPoolsResponse;
      setSavedPools(Array.isArray(data.pools) ? data.pools : []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load saved pools",
        description: "Please retry in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoadingSavedPools(false);
    }
  }

  useEffect(() => {
    void fetchQuestionPool();
    void fetchSavedPools();
  }, []);

  async function saveSelectedAsPool() {
    if (!poolName.trim()) {
      toast({
        title: "Pool name required",
        description: "Enter a pool name before saving.",
        variant: "destructive",
      });
      return;
    }

    if (selectedIds.length === 0) {
      toast({
        title: "No questions selected",
        description: "Pick at least one question to create a pool.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingPool(true);
      const response = await fetch("/api/contest/question-pools", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: poolName.trim(),
          description: poolDescription.trim(),
          questionIds: selectedIds,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pool");
      }

      toast({
        title: "Pool saved",
        description: `Saved \"${poolName.trim()}\" with ${selectedIds.length} questions.`,
      });

      setPoolName("");
      setPoolDescription("");
      void fetchSavedPools();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingPool(false);
    }
  }

  async function applySavedPool(poolId: string) {
    try {
      const response = await fetch(`/api/contest/question-pools/${poolId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load saved pool");
      }

      const data = (await response.json()) as SavedPoolDetailResponse;
      const ids = data.pool.questionIds || [];
      setSelectedIds(ids);

      toast({
        title: "Pool loaded",
        description: `Applied ${ids.length} saved questions to current selection.`,
      });
    } catch (error) {
      toast({
        title: "Failed to apply pool",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function deleteSavedPool(poolId: string, name: string) {
    try {
      const response = await fetch(`/api/contest/question-pools/${poolId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete pool");
      }

      setSavedPools((prev) => prev.filter((pool) => pool.id !== poolId));
      toast({
        title: "Pool deleted",
        description: `Deleted \"${name}\".`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((item) => item !== id);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function copySelectedIds() {
    if (!selectedCount) {
      toast({
        title: "No questions selected",
        description: "Select at least one question before copying IDs.",
      });
      return;
    }

    await navigator.clipboard.writeText(selectedIdCsv);
    toast({
      title: "Copied",
      description: `${selectedCount} question IDs copied for challenge setup.`,
    });
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "challenge-questions-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setCsvFile(file);
    setImportResult(null);
    setCsvPreviewHeaders([]);
    setCsvPreviewRows([]);
    setCsvPreviewTotalRows(0);
    setCsvPreviewError(null);

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const preview = buildCsvPreview(rawText);

      setCsvPreviewHeaders(preview.headers);
      setCsvPreviewRows(preview.rows.slice(0, 30));
      setCsvPreviewTotalRows(preview.rows.length);
    } catch (error) {
      console.error(error);
      setCsvPreviewError(error instanceof Error ? error.message : "Failed to parse CSV preview.");
    }
  }

  async function handleCsvImport() {
    if (!csvFile) {
      toast({
        title: "CSV file required",
        description: "Choose a CSV file before importing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingImport(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("difficulty", importDifficulty);
      formData.append("type", importType);
      formData.append("category", importCategory);
      formData.append("challengeType", importChallengeType);
      formData.append("points", importPoints);
      formData.append("timeAllocationSeconds", importTimeAllocation);

      const response = await fetch("/api/contest/question-pool/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = (await response.json()) as ImportResponse | { error: string };

      if (!response.ok) {
        const message = "error" in data ? data.error : "Import failed";
        toast({
          title: "Import failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      setImportResult(data as ImportResponse);
      toast({
        title: "CSV imported",
        description: `Created ${(data as ImportResponse).created} questions.`,
      });

      void fetchQuestionPool();
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please verify CSV format and retry.",
        variant: "destructive",
      });
    } finally {
      setSubmittingImport(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Challenge Question Sets Admin</h1>
          <p className="text-muted-foreground mt-2">
            Choose existing question sets for challenges or upload a CSV in the supported format.
          </p>
        </div>

        <Tabs defaultValue="choose" className="space-y-6">
          <TabsList>
            <TabsTrigger value="choose">Choose Question Sets</TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="choose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Select Existing Questions
                </CardTitle>
                <CardDescription>
                  Build a curated ID list for challenge creation flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Search</Label>
                    <Input
                      placeholder="question, category, tag"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {categories.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button className="w-full" onClick={() => void fetchQuestionPool()} disabled={loadingPool}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary">Selected: {selectedCount}</Badge>
                  <Button variant="outline" onClick={copySelectedIds} disabled={!selectedCount}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Selected IDs
                  </Button>
                  <Button variant="ghost" onClick={clearSelection} disabled={!selectedCount}>
                    Clear
                  </Button>
                </div>

                <div className="rounded-md border p-4 space-y-3">
                  <div>
                    <h3 className="font-medium">Create Named Pool</h3>
                    <p className="text-sm text-muted-foreground">
                      Save the selected IDs as a reusable pool for challenge creation.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-1 md:col-span-1">
                      <Label>Pool Name</Label>
                      <Input
                        placeholder="Aptitude Round 1"
                        value={poolName}
                        onChange={(e) => setPoolName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="Optional description for this pool"
                        value={poolDescription}
                        onChange={(e) => setPoolDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveSelectedAsPool} disabled={savingPool || selectedCount === 0}>
                      <Save className="w-4 h-4 mr-2" />
                      {savingPool ? "Saving..." : "Save Selected as Pool"}
                    </Button>
                    <Button variant="outline" onClick={() => void fetchSavedPools()} disabled={loadingSavedPools}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Refresh Saved Pools
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border p-4 space-y-3">
                  <div>
                    <h3 className="font-medium">Saved Pools</h3>
                    <p className="text-sm text-muted-foreground">
                      These pool names will be available during challenge creation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {!loadingSavedPools && savedPools.length === 0 && (
                      <p className="text-sm text-muted-foreground">No saved pools yet.</p>
                    )}
                    {savedPools.map((pool) => (
                      <div key={pool.id} className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{pool.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pool.questionCount} questions
                            {pool.description ? ` • ${pool.description}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => void applySavedPool(pool.id)}>
                            Use Selection
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void deleteSavedPool(pool.id, pool.name)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pick</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((item) => {
                        const isChecked = selectedIds.includes(item.id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => toggleSelection(item.id, Boolean(checked))}
                              />
                            </TableCell>
                            <TableCell className="max-w-md truncate" title={item.questionText}>
                              {item.questionText}
                            </TableCell>
                            <TableCell className="capitalize">{item.difficulty}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.points}</TableCell>
                            <TableCell>{item.timeAllocationSeconds}s</TableCell>
                          </TableRow>
                        );
                      })}
                      {!loadingPool && questions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No questions found for the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  CSV Import for Challenge Questions
                </CardTitle>
                <CardDescription>
                  Required columns: question, correctAnswer. Use options as pipe-separated text or option1..option4 fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-3">
                    <Label>CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFileChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Default Difficulty</Label>
                    <Select value={importDifficulty} onValueChange={setImportDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Default Type</Label>
                    <Select value={importType} onValueChange={setImportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Default Category</Label>
                    <Input value={importCategory} onChange={(e) => setImportCategory(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Default Challenge Type</Label>
                    <Input value={importChallengeType} onChange={(e) => setImportChallengeType(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Default Points</Label>
                    <Input value={importPoints} type="number" onChange={(e) => setImportPoints(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Default Time (seconds)</Label>
                    <Input
                      value={importTimeAllocation}
                      type="number"
                      onChange={(e) => setImportTimeAllocation(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleCsvImport} disabled={submittingImport || !csvFile}>
                  <Upload className="w-4 h-4 mr-2" />
                  {submittingImport ? "Importing..." : "Import CSV"}
                </Button>

                {csvFile && (
                  <div className="rounded-xl border bg-card/60 p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{csvPreviewTotalRows} data rows</Badge>
                      <Badge variant="outline">{csvPreviewHeaders.length} columns</Badge>
                      {missingRequiredColumns.length === 0 ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Required columns detected</Badge>
                      ) : (
                        <Badge variant="destructive">Missing: {missingRequiredColumns.join(", ")}</Badge>
                      )}
                    </div>

                    {csvPreviewError && (
                      <p className="text-sm text-destructive">Preview error: {csvPreviewError}</p>
                    )}

                    {!csvPreviewError && csvPreviewRows.length > 0 && (
                      <div className="rounded-lg border overflow-hidden overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-16">Row</TableHead>
                              {csvPreviewHeaders.map((header, headerIndex) => (
                                <TableHead key={`${header}-${headerIndex}`} className="min-w-[150px]">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvPreviewRows.map((row) => (
                              <TableRow key={row.rowNumber}>
                                <TableCell className="font-medium text-muted-foreground">{row.rowNumber}</TableCell>
                                {csvPreviewHeaders.map((header, headerIndex) => (
                                  <TableCell
                                    key={`${row.rowNumber}-${header}-${headerIndex}`}
                                    className="max-w-[260px] truncate"
                                    title={row.values[header] || ""}
                                  >
                                    {row.values[header] || "-"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {!csvPreviewError && csvPreviewTotalRows > csvPreviewRows.length && (
                      <p className="text-xs text-muted-foreground">
                        Showing first {csvPreviewRows.length} rows out of {csvPreviewTotalRows}.
                      </p>
                    )}

                    {!csvPreviewError && csvPreviewTotalRows === 0 && (
                      <p className="text-sm text-muted-foreground">No data rows detected in this CSV file.</p>
                    )}
                  </div>
                )}

                {importResult && (
                  <div className="rounded-md border p-4 space-y-2">
                    <p className="text-sm">Rows: {importResult.totalRows}</p>
                    <p className="text-sm text-green-700">Created: {importResult.created}</p>
                    <p className="text-sm text-amber-700">Skipped: {importResult.skipped}</p>
                    {importResult.errors.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Validation issues</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {importResult.errors.slice(0, 20).map((err, index) => (
                            <li key={`${err.row}-${index}`}>
                              Row {err.row}: {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
