import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON to YAML Conversion?", content: "JSON is the standard data interchange format for APIs and web applications. Converting JSON to YAML produces a more human-readable representation, ideal for configuration files, documentation, and DevOps workflows." },
  howToUse: "Paste your JSON input, choose an indentation level, and click Convert. Copy or download the resulting YAML.",
  faqs: [
    { question: "Will comments be added to the YAML output?", answer: "No — since JSON doesn't contain comments, the YAML output won't have them either. You can add comments manually afterward." },
    { question: "Is my data uploaded anywhere?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    { question: "Does it handle nested JSON?", answer: "Yes — deeply nested objects and arrays are fully supported and converted to proper YAML indentation." },
  ],
};

export default data;
