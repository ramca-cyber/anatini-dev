import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Log Viewer?", content: "A log viewer helps you read, filter, and search through log files. It auto-detects log levels (ERROR, WARN, INFO, DEBUG, TRACE), provides regex-based filtering, and displays line numbers for easy reference." },
  howToUse: "Drop a log file, paste log text, or click Upload. Toggle log levels to show/hide entries. Use the regex filter to search for specific patterns. Export filtered results.",
  faqs: [
    { question: "What log formats are supported?", answer: "The viewer auto-detects common patterns like [ERROR], ERROR:, and level=error in any text-based log format." },
    { question: "Can I filter by multiple criteria?", answer: "Yes — combine level toggles with regex patterns to narrow down exactly the log entries you need." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
