import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is an XML Formatter?", content: "An XML formatter takes raw or minified XML and displays it with proper indentation and line breaks for human readability. It can also minify XML (remove whitespace), validate syntax, and help you spot structural issues in your documents." },
  howToUse: "Paste XML in the input area. The formatter auto-formats with your chosen indentation. Use Minify to compress, Validate to check syntax. Copy or download the result.",
  faqs: [
    { question: "Does it validate XML?", answer: "Yes — the formatter uses the browser's built-in DOMParser which performs well-formedness validation. Click Validate for explicit checking." },
    { question: "Does it support namespaces?", answer: "Yes — XML namespaces are preserved during formatting. The browser's DOMParser handles namespace-aware parsing." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
