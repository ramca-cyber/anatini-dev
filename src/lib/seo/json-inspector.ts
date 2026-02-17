import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a JSON Inspector?", content: "A JSON Inspector analyzes the structure and schema of JSON files. It checks schema consistency across records, counts value types, maps all keys with their nesting paths, and detects inconsistencies — essential for understanding API responses and complex JSON datasets." },
  howToUse: "Upload a JSON file and the inspector automatically analyzes structure, schema consistency, value type distribution, and all key paths. For arrays of objects, it compares key sets across records to find missing fields.",
  faqs: [
    { question: "What does 'schema consistency' mean?", answer: "For arrays of objects, it checks if every object has the same set of keys. Inconsistent schemas mean some records are missing fields — common in API responses." },
    { question: "What is nesting depth?", answer: "How many levels of objects-within-objects exist. Depth 1 = flat. Depth 4 = like user.address.city.zipCode. Deep nesting may need flattening before CSV conversion." },
  ],
};

export default data;
