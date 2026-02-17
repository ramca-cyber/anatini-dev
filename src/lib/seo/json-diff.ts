import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON Diff?", content: "JSON Diff compares two JSON documents and highlights added, removed, and changed values. It's useful for debugging API responses, comparing configurations, or reviewing data changes between versions." },
  howToUse: "Paste or upload two JSON documents in the left and right panels. The tool automatically compares them and highlights differences with color-coded markers. Added values are green, removed are red, and changed values show both old and new.",
  faqs: [
    { question: "Does it handle nested objects?", answer: "Yes — the diff engine recursively compares nested objects and arrays, showing differences at every level of the structure." },
    { question: "Can I compare large JSON files?", answer: "Yes, but very large files (10MB+) may be slow since the comparison runs entirely in your browser." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
