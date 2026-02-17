import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON to TOML Conversion?", content: "Converting JSON to TOML produces a human-readable configuration format from JSON data. TOML is popular for config files in Rust, Python, and DevOps tooling. Not all JSON structures can be represented in TOML — the root must be an object." },
  howToUse: "Paste your JSON input and the conversion happens automatically. Copy or download the resulting TOML file.",
  faqs: [
    { question: "Can any JSON be converted to TOML?", answer: "TOML requires a top-level object (table). Primitive values or arrays at the root level cannot be represented. Nested objects and arrays of tables are fully supported." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    { question: "Are datetime values preserved?", answer: "If your JSON contains ISO 8601 date strings, they'll be output as TOML strings. TOML has native datetime support but the converter treats them as strings." },
  ],
};

export default data;
