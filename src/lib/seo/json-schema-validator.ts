import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON Schema Validation?", content: "JSON Schema is a vocabulary for annotating and validating JSON documents. It defines the structure, types, and constraints that a JSON document must conform to. Validation checks a document against a schema and reports any violations with specific paths." },
  howToUse: "Paste a JSON Schema on the left and a JSON document on the right. Click 'Validate' to check conformance. Errors show the exact path and violation message. Load a sample to get started.",
  faqs: [
    { question: "Which JSON Schema drafts are supported?", answer: "The validator uses Ajv which supports JSON Schema drafts 4, 6, 7, and 2019-09 by default." },
    { question: "Does it show all errors at once?", answer: "Yes — all validation errors are displayed with their instance paths, not just the first one." },
    { question: "Is my data uploaded?", answer: "No — validation runs entirely in your browser using the Ajv library. No data leaves your machine." },
  ],
};

export default data;
