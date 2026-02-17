import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is TOML to JSON Conversion?", content: "TOML (Tom's Obvious, Minimal Language) is a configuration file format designed to be easy to read. Converting TOML to JSON lets you use config data in APIs, web applications, and tooling that expects JSON." },
  howToUse: "Paste your TOML input, choose an indentation level, and the conversion happens automatically. Copy or download the resulting JSON.",
  faqs: [
    { question: "Does it support all TOML features?", answer: "Yes — tables, arrays of tables, inline tables, multi-line strings, datetime values, and all TOML 1.0 features are supported via the smol-toml library." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    { question: "Can I convert TOML with comments?", answer: "Comments are parsed but not preserved in JSON output, since JSON doesn't support comments." },
  ],
};

export default data;
