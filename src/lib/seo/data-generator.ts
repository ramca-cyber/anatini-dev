import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Data Generator?", content: "A data generator creates synthetic datasets with realistic-looking values. Configure column names and types (name, email, integer, date, UUID, etc.), set the row count, and generate instantly. Useful for testing, prototyping, demos, and populating development databases." },
  howToUse: "Define your columns with names and types. Set the row count (up to 10,000) and an optional seed for reproducibility. Click 'Generate' to create the data. Download as CSV or JSON.",
  faqs: [
    { question: "Is the data truly random?", answer: "It uses a seeded pseudo-random number generator. The same seed always produces the same data, which is useful for reproducible testing." },
    { question: "What column types are available?", answer: "Name, Email, Integer, Float, Date, UUID, Boolean, City, Company, and Phone number." },
    { question: "Can I generate more than 10,000 rows?", answer: "The limit is 10,000 rows to keep the browser responsive. For larger datasets, generate multiple batches or use a CLI tool." },
  ],
};

export default data;
