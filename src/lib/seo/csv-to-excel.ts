import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is CSV to Excel conversion?", content: "CSV to Excel conversion takes plain-text tabular data and packages it into an Excel workbook (.xlsx). You can combine multiple CSV files into separate sheets within a single workbook, making it easy to organize related datasets." },
  howToUse: "Drop a CSV file to start. Add more CSV files to create a multi-sheet Excel workbook. Name each sheet, then download the combined .xlsx file.",
  faqs: [
    { question: "Can I combine multiple CSVs into one Excel file?", answer: "Yes! Add multiple CSV files and each one becomes a named sheet in the output Excel workbook." },
    { question: "Is my data uploaded anywhere?", answer: "No. All processing happens locally in your browser using the SheetJS library. Your files never leave your machine." },
    { question: "What output format is used?", answer: "The output is a modern .xlsx file compatible with Excel, Google Sheets, LibreOffice, and other spreadsheet applications." },
    { question: "Are data types preserved?", answer: "SheetJS infers numeric and date types from your CSV data. Review the output to ensure types are mapped correctly." },
  ],
};

export default data;
