import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Excel to CSV conversion?", content: "Excel files (.xlsx, .xls) store data in a binary format with support for multiple sheets, formulas, and formatting. CSV is a simpler plain-text format. Converting Excel to CSV makes your data accessible to any tool that reads text files." },
  howToUse: "Drop an Excel file. Select which sheets to export, preview the data, and download as CSV. Multi-sheet workbooks are fully supported — export one sheet or all at once.",
  faqs: [
    { question: "Are formulas preserved?", answer: "No — formulas are evaluated and their resulting values are exported. Only the data values are converted." },
    { question: "Can I convert specific sheets?", answer: "Yes. When you upload a multi-sheet Excel file, you can select which sheets to view and export individually." },
    { question: "Is formatting preserved?", answer: "No — CSV is plain text and doesn't support formatting. Only the raw cell values are converted." },
    { question: "What Excel formats are supported?", answer: "Both .xlsx (modern) and .xls (legacy) formats are supported via the SheetJS library." },
  ],
};

export default data;
