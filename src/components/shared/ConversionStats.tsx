interface ConversionStatsProps {
  rows: number;
  columns: number;
  inputFormat?: string;
  outputFormat?: string;
}

export function ConversionStats({ rows, columns, inputFormat, outputFormat }: ConversionStatsProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border bg-muted/30 px-3 py-1.5 rounded">
      <span className="font-medium text-foreground">
        Converted {rows.toLocaleString()} rows × {columns} columns
      </span>
      {inputFormat && outputFormat && (
        <span>· {inputFormat} → {outputFormat}</span>
      )}
    </div>
  );
}
