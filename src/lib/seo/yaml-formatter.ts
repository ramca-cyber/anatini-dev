import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a YAML Formatter?", content: "A YAML formatter takes raw or messy YAML and displays it with consistent indentation and structure. It can also minify YAML (compact representation), validate syntax, and help you spot structural issues in configuration files." },
  howToUse: "Paste YAML in the input area. The formatter auto-formats with your chosen indentation. Use Minify to compact, Validate to check syntax. Copy or download the result.",
  faqs: [
    { question: "Does it validate YAML?", answer: "Yes — the formatter uses the js-yaml library for parsing and validation. Click Validate for explicit checking with detailed error messages." },
    { question: "Does it support multi-document YAML?", answer: "Currently the formatter processes single YAML documents. Multi-document streams (separated by ---) may not be fully preserved." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
