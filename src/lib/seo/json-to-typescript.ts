import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON to TypeScript?", content: "This tool analyzes JSON data and generates TypeScript type definitions — either interfaces or type aliases. It infers types from values, handles nested objects and arrays, and creates sub-types for complex structures." },
  howToUse: "Paste JSON in the input. Choose between interface or type alias style and set the root type name. TypeScript definitions generate automatically. Copy the output for your codebase.",
  faqs: [
    { question: "Does it handle nested objects?", answer: "Yes — nested objects are extracted as separate interfaces/types and referenced by name." },
    { question: "Does it handle arrays?", answer: "Yes — array types are inferred from their contents. Mixed-type arrays use union types." },
    { question: "Is my data uploaded?", answer: "No — all inference runs in your browser." },
  ],
};

export default data;
