import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON Flattening?", content: "JSON flattening transforms deeply nested JSON objects into a flat, tabular structure. Nested keys are concatenated with a separator (e.g., address.city becomes a column name). This makes nested data compatible with spreadsheets, databases, and analytical tools." },
  howToUse: "Upload a JSON or JSONL file. Choose your separator (dot, underscore), naming convention, and array handling preferences. The tool recursively expands nested objects and arrays into flat columns, displayed in a data table. Download the result as CSV.",
  faqs: [
    { question: "How deep does flattening go?", answer: "The tool recursively flattens up to 10 levels deep, which covers virtually all real-world JSON structures." },
    { question: "How are arrays handled?", answer: "Arrays can be unnested (one row per element) or kept as-is depending on your settings." },
    { question: "What separator options are available?", answer: "Dot (address.city) and underscore (address_city) separators are supported." },
  ],
};

export default data;
