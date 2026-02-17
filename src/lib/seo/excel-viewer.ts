import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is an Excel Viewer?", content: "An Excel viewer lets you open and browse spreadsheet files (.xlsx, .xls) directly in your browser without installing Excel or any other software. Navigate between sheets, sort columns, and explore your data — all offline." },
  howToUse: "Drop an Excel file or load from URL. Switch between sheets using the tab bar. Data is displayed in a sortable, paginated table. Use the 'Try with sample data' button to explore the viewer.",
  faqs: [
    { question: "What Excel formats are supported?", answer: "Both .xlsx (modern) and .xls (legacy) formats are supported via the SheetJS library." },
    { question: "Is my data uploaded?", answer: "No — all processing happens locally in your browser. Your files never leave your machine." },
    { question: "Can I edit the data?", answer: "This is a read-only viewer. For conversions, use the Excel to CSV tool or SQL Playground." },
    { question: "How many rows can it handle?", answer: "The viewer displays all rows with client-side pagination. Very large files (50MB+) may be slow due to browser memory." },
  ],
};

export default data;
