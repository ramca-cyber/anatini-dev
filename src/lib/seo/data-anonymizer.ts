import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Data Anonymization?", content: "Data anonymization replaces sensitive or personally identifiable information (PII) with fake, hashed, or redacted values. This lets you share datasets safely for testing, demos, or analytics without exposing real names, emails, or other private data." },
  howToUse: "Upload a data file. Select which columns to anonymize and choose a masking strategy for each: redact, hash, fake name, fake email, random number, or shuffle. Click 'Anonymize' to preview the result, then download the anonymized CSV.",
  faqs: [
    { question: "Is the anonymization deterministic?", answer: "Hash, fake name, and fake email strategies are deterministic — the same input always produces the same output. Shuffle and random number are not." },
    { question: "What masking strategies are available?", answer: "Redact (replace with ***), Hash (SHA-based hex), Fake Name, Fake Email, Random Number, and Shuffle (randomly reorder values within the column)." },
    { question: "Is my data uploaded?", answer: "No — all processing runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
