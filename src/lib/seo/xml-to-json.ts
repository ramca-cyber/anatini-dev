import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is XML to JSON Conversion?", content: "XML (Extensible Markup Language) is a widely-used format for data interchange, configuration files, and document markup. Converting XML to JSON makes the data accessible to JavaScript applications, REST APIs, and modern tooling that prefers JSON." },
  howToUse: "Paste XML or load a sample. Choose how attributes are handled (@prefix or flatten). The tool auto-converts on input. Copy or download the JSON output.",
  faqs: [
    { question: "How are XML attributes handled?", answer: "By default, attributes are prefixed with @ (e.g., @id). You can also flatten them to remove the prefix." },
    { question: "Does it handle namespaces?", answer: "Namespaces are preserved as-is in tag names. The browser's DOMParser handles all standard XML features." },
    { question: "Is my data uploaded?", answer: "No — conversion runs entirely in your browser using the built-in DOMParser. No data leaves your machine." },
  ],
};

export default data;
