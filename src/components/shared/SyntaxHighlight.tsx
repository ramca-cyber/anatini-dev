import { ReactNode } from "react";

// --- JSON ---
export function highlightJson(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match JSON tokens
  const regex = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|((?:-?\d+\.?\d*(?:[eE][+-]?\d+)?))|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[1]) {
      // Key (with colon)
      const colonIdx = match[1].lastIndexOf(":");
      nodes.push(<span key={key++} className="text-foreground font-medium">{match[1].slice(0, colonIdx)}</span>);
      nodes.push(<span key={key++} className="text-muted-foreground">{":"}</span>);
      if (match[1].slice(colonIdx + 1).trim()) {
        nodes.push(<span key={key++}>{match[1].slice(colonIdx + 1)}</span>);
      }
    } else if (match[2]) {
      nodes.push(<span key={key++} className="text-green-600 dark:text-green-400">{match[2]}</span>);
    } else if (match[3]) {
      nodes.push(<span key={key++} className="text-blue-600 dark:text-blue-400">{match[3]}</span>);
    } else if (match[4]) {
      nodes.push(<span key={key++} className="text-purple-600 dark:text-purple-400">{match[4]}</span>);
    } else if (match[5]) {
      nodes.push(<span key={key++} className="text-red-500 dark:text-red-400">{match[5]}</span>);
    } else if (match[6]) {
      nodes.push(<span key={key++} className="text-muted-foreground">{match[6]}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return nodes;
}

// --- XML ---
export function highlightXml(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match XML tokens: comments, PIs, tags with attrs, text
  const regex = /(<!--[\s\S]*?-->)|(<\?[\s\S]*?\?>)|(<\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*"|\s+[\w:.-]+\s*=\s*'[^']*')*)\s*(\/?>)|([^<]+)/g;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Comment
      nodes.push(<span key={key++} className="text-muted-foreground italic">{match[1]}</span>);
    } else if (match[2]) {
      // Processing instruction
      nodes.push(<span key={key++} className="text-purple-600 dark:text-purple-400">{match[2]}</span>);
    } else if (match[3]) {
      // Tag
      nodes.push(<span key={key++} className="text-blue-600 dark:text-blue-400">{match[3]}{match[4]}</span>);
      // Attributes
      if (match[5]) {
        const attrRegex = /([\w:.-]+)(\s*=\s*)("[^"]*"|'[^']*')/g;
        let attrMatch: RegExpExecArray | null;
        let attrLastIndex = 0;
        const attrStr = match[5];
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
          if (attrMatch.index > attrLastIndex) {
            nodes.push(<span key={key++}>{attrStr.slice(attrLastIndex, attrMatch.index)}</span>);
          }
          nodes.push(<span key={key++} className="text-orange-600 dark:text-orange-400">{attrMatch[1]}</span>);
          nodes.push(<span key={key++} className="text-muted-foreground">{attrMatch[2]}</span>);
          nodes.push(<span key={key++} className="text-green-600 dark:text-green-400">{attrMatch[3]}</span>);
          attrLastIndex = attrRegex.lastIndex;
        }
        if (attrLastIndex < attrStr.length) {
          nodes.push(<span key={key++}>{attrStr.slice(attrLastIndex)}</span>);
        }
      }
      nodes.push(<span key={key++} className="text-blue-600 dark:text-blue-400">{match[6]}</span>);
    } else if (match[7]) {
      // Text content
      nodes.push(<span key={key++} className="text-foreground">{match[7]}</span>);
    }
  }
  return nodes;
}

// --- YAML ---
export function highlightYaml(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    let content: ReactNode;
    if (/^\s*#/.test(line)) {
      content = <span className="text-muted-foreground italic">{line}</span>;
    } else if (/^(\s*-\s)/.test(line)) {
      const dashMatch = line.match(/^(\s*-\s)(.*)/);
      if (dashMatch) {
        content = <><span className="text-muted-foreground">{dashMatch[1]}</span>{colorYamlValue(dashMatch[2])}</>;
      } else {
        content = <span>{line}</span>;
      }
    } else if (/:/.test(line)) {
      const colonIdx = line.indexOf(":");
      const keyPart = line.slice(0, colonIdx);
      const rest = line.slice(colonIdx + 1);
      content = <><span className="text-blue-600 dark:text-blue-400 font-medium">{keyPart}</span><span className="text-muted-foreground">:</span>{colorYamlValue(rest)}</>;
    } else {
      content = <span>{line}</span>;
    }
    return <span key={i}>{content}{i < text.split("\n").length - 1 ? "\n" : ""}</span>;
  });
}

function colorYamlValue(val: string): ReactNode {
  const trimmed = val.trim();
  if (!trimmed) return <span>{val}</span>;
  if (/^(true|false)$/i.test(trimmed)) return <span className="text-orange-600 dark:text-orange-400">{val}</span>;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return <span className="text-purple-600 dark:text-purple-400">{val}</span>;
  if (/^null$/i.test(trimmed)) return <span className="text-red-500 dark:text-red-400">{val}</span>;
  if (/^['"]/.test(trimmed)) return <span className="text-green-600 dark:text-green-400">{val}</span>;
  return <span className="text-green-600 dark:text-green-400">{val}</span>;
}

// --- SQL ---
const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN",
  "LIKE", "IS", "NULL", "AS", "ON", "JOIN", "INNER", "LEFT", "RIGHT", "OUTER",
  "FULL", "CROSS", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET",
  "UNION", "ALL", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE",
  "DROP", "ALTER", "ADD", "COLUMN", "INDEX", "PRIMARY", "KEY", "FOREIGN",
  "REFERENCES", "CONSTRAINT", "DEFAULT", "CHECK", "UNIQUE", "IF",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "CASCADE", "REPLACE",
  // Types
  "INTEGER", "INT", "BIGINT", "SMALLINT", "FLOAT", "DOUBLE", "DECIMAL",
  "NUMERIC", "REAL", "BOOLEAN", "BOOL", "TEXT", "VARCHAR", "CHAR",
  "DATE", "TIME", "TIMESTAMP", "BLOB", "JSON", "JSONB", "UUID",
  "SERIAL", "NVARCHAR", "BIT", "TINYINT", "DATETIME", "DATETIME2",
  "PRECISION", "MAX", "STRING", "INT64", "FLOAT64", "BYTES", "HUGEINT",
]);

export function highlightSql(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match SQL tokens: comments, strings, numbers, words, operators, other
  const regex = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*')|((?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)|([a-zA-Z_]\w*(?:\([^)]*\))?)|([<>=!]+|[+\-*/%])|(\n)|([^a-zA-Z_\d\s'<>=!+\-*/%\n]+)|(\s+)/g;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      nodes.push(<span key={key++} className="text-muted-foreground italic">{match[1]}</span>);
    } else if (match[2]) {
      nodes.push(<span key={key++} className="text-green-600 dark:text-green-400">{match[2]}</span>);
    } else if (match[3]) {
      nodes.push(<span key={key++} className="text-purple-600 dark:text-purple-400">{match[3]}</span>);
    } else if (match[4]) {
      const word = match[4];
      const base = word.replace(/\(.*\)$/, "").toUpperCase();
      if (SQL_KEYWORDS.has(base)) {
        nodes.push(<span key={key++} className="text-blue-600 dark:text-blue-400 font-bold">{match[4]}</span>);
      } else if (/^(TRUE|FALSE)$/i.test(word)) {
        nodes.push(<span key={key++} className="text-purple-600 dark:text-purple-400">{match[4]}</span>);
      } else if (/^(NOT|NULL)$/i.test(base)) {
        nodes.push(<span key={key++} className="text-blue-600 dark:text-blue-400 font-bold">{match[4]}</span>);
      } else {
        nodes.push(<span key={key++} className="text-foreground">{match[4]}</span>);
      }
    } else if (match[5]) {
      nodes.push(<span key={key++} className="text-orange-600 dark:text-orange-400">{match[5]}</span>);
    } else {
      nodes.push(<span key={key++}>{match[0]}</span>);
    }
  }
  return nodes;
}
