import { useState } from "react";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { getToolSeo, getToolMetaDescription } from "@/lib/seo-content";
import { Wand2, Download, Plus, Trash2, Copy } from "lucide-react";
import { ToolPage } from "@/components/shared/ToolPage";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type ColType = "name" | "email" | "integer" | "float" | "date" | "uuid" | "boolean" | "city" | "company" | "phone";

const colTypes: { value: ColType; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "date", label: "Date" },
  { value: "uuid", label: "UUID" },
  { value: "boolean", label: "Boolean" },
  { value: "city", label: "City" },
  { value: "company", label: "Company" },
  { value: "phone", label: "Phone" },
];

interface ColDef {
  id: string;
  name: string;
  type: ColType;
}

// Simple generators
const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const cities = ["New York", "London", "Tokyo", "Paris", "Sydney", "Berlin", "Toronto", "Mumbai", "São Paulo", "Dubai", "Singapore", "Amsterdam", "Seoul", "Chicago", "Melbourne", "Stockholm", "Vienna", "Zurich", "Barcelona", "Oslo"];
const companies = ["Acme Corp", "Globex", "Initech", "Umbrella", "Stark Industries", "Wayne Enterprises", "Cyberdyne", "Soylent Corp", "Hooli", "Pied Piper", "Dunder Mifflin", "Sterling Cooper", "Wonka Industries", "Aperture Science", "Weyland-Yutani"];
const emailDomains = ["example.com", "test.org", "company.net", "work.io", "mail.dev"];

function rng(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateValue(type: ColType, rand: () => number, rowIdx: number): any {
  switch (type) {
    case "name": return `${firstNames[Math.floor(rand() * firstNames.length)]} ${lastNames[Math.floor(rand() * lastNames.length)]}`;
    case "email": {
      const first = firstNames[Math.floor(rand() * firstNames.length)].toLowerCase();
      const last = lastNames[Math.floor(rand() * lastNames.length)].toLowerCase();
      return `${first}.${last}@${emailDomains[Math.floor(rand() * emailDomains.length)]}`;
    }
    case "integer": return Math.floor(rand() * 10000);
    case "float": return Math.round(rand() * 1000 * 100) / 100;
    case "date": {
      const start = new Date(2020, 0, 1).getTime();
      const end = new Date(2026, 0, 1).getTime();
      return new Date(start + rand() * (end - start)).toISOString().split("T")[0];
    }
    case "uuid": {
      const hex = () => Math.floor(rand() * 16).toString(16);
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.floor(rand() * 16);
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
    case "boolean": return rand() > 0.5;
    case "city": return cities[Math.floor(rand() * cities.length)];
    case "company": return companies[Math.floor(rand() * companies.length)];
    case "phone": return `+1-${String(Math.floor(rand() * 900 + 100))}-${String(Math.floor(rand() * 900 + 100))}-${String(Math.floor(rand() * 9000 + 1000))}`;
  }
}

let nextId = 1;

export default function DataGeneratorPage() {
  const [columns, setColumns] = useState<ColDef[]>([
    { id: "c1", name: "name", type: "name" },
    { id: "c2", name: "email", type: "email" },
    { id: "c3", name: "age", type: "integer" },
    { id: "c4", name: "city", type: "city" },
  ]);
  const [rowCount, setRowCount] = useState(100);
  const [seed, setSeed] = useState(42);
  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; types: string[] } | null>(null);
  const [allRows, setAllRows] = useState<any[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addColumn() {
    nextId++;
    setColumns(prev => [...prev, { id: `c${nextId}`, name: `col_${nextId}`, type: "name" }]);
  }

  function removeColumn(id: string) {
    setColumns(prev => prev.filter(c => c.id !== id));
  }

  function updateColumn(id: string, field: "name" | "type", value: string) {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function handleGenerate() {
    setError(null);
    if (columns.length === 0) { setError("Add at least one column"); return; }
    if (columns.some(c => !c.name.trim())) { setError("All columns must have names"); return; }
    const count = Math.min(Math.max(1, rowCount), 10000);

    const rand = rng(seed);
    const rows: any[][] = [];
    for (let i = 0; i < count; i++) {
      rows.push(columns.map(c => generateValue(c.type, rand, i)));
    }

    setAllRows(rows);
    setResult({
      columns: columns.map(c => c.name),
      rows: rows.slice(0, 200),
      types: columns.map(c => {
        switch (c.type) {
          case "integer": return "INTEGER";
          case "float": return "DOUBLE";
          case "boolean": return "BOOLEAN";
          case "date": return "DATE";
          default: return "VARCHAR";
        }
      }),
    });
  }

  function downloadAs(format: "csv" | "json") {
    if (!allRows || columns.length === 0) return;
    const colNames = columns.map(c => c.name);

    if (format === "csv") {
      const header = colNames.map(n => `"${n}"`).join(",");
      const body = allRows.map(row => row.map(v => v === null ? "" : typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v)).join(",")).join("\n");
      const blob = new Blob([header + "\n" + body], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "generated_data.csv"; a.click();
      URL.revokeObjectURL(url);
    } else {
      const objs = allRows.map(row => {
        const obj: Record<string, any> = {};
        colNames.forEach((n, i) => { obj[n] = row[i]; });
        return obj;
      });
      const blob = new Blob([JSON.stringify(objs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "generated_data.json"; a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <ToolPage icon={Wand2} title="Data Generator" description="Generate realistic sample datasets with configurable columns and types." pageTitle="Data Generator — Free, Offline | Anatini.dev" metaDescription={getToolMetaDescription("data-generator")} seoContent={getToolSeo("data-generator")}>
      <div className="space-y-4">
        {/* Column config */}
        <div className="border border-border bg-muted/30 p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Column Configuration</h3>
          <div className="space-y-2">
            {columns.map(col => (
              <div key={col.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={col.name}
                  onChange={e => updateColumn(col.id, "name", e.target.value)}
                  placeholder="Column name"
                  className="border border-border bg-background px-2 py-1 text-xs font-mono flex-1 min-w-0"
                />
                <select
                  value={col.type}
                  onChange={e => updateColumn(col.id, "type", e.target.value)}
                  className="border border-border bg-background px-2 py-1 text-xs"
                >
                  {colTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button onClick={() => removeColumn(col.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-3 w-3 mr-1" /> Add Column
          </Button>
        </div>

        {/* Options */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Rows</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={rowCount}
                onChange={e => setRowCount(Math.max(1, Number(e.target.value)))}
                className="border border-border bg-background px-2 py-1 text-xs w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-bold">Seed</label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="border border-border bg-background px-2 py-1 text-xs w-20"
              />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={columns.length === 0}>
            <Wand2 className="h-4 w-4 mr-1" /> Generate
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3 border-2 border-border p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Generated Data ({allRows?.length.toLocaleString()} rows)
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadAs("csv")}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadAs("json")}>
                  <Download className="h-3 w-3 mr-1" /> JSON
                </Button>
              </div>
            </div>
            <DataTable columns={result.columns} rows={result.rows} types={result.types} className="max-h-[500px]" />
            {allRows && allRows.length > 200 && (
              <p className="text-xs text-muted-foreground text-center">Showing first 200 of {allRows.length.toLocaleString()} rows</p>
            )}
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </ToolPage>
  );
}
