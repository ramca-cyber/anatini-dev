import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is JSON to XML Conversion?", content: "Converting JSON to XML transforms JavaScript-native data structures into the widely-supported XML format. This is useful for integrating with SOAP APIs, legacy systems, and tools that require XML input." },
  howToUse: "Paste JSON or load a sample. Set the root element name and array item element name. The tool auto-converts on input. Copy or download the XML output.",
  faqs: [
    { question: "What is the root element name?", answer: "When the JSON doesn't have a single top-level key, a root element wraps the output. Default is 'root' — customize it in the options." },
    { question: "How are arrays converted?", answer: "Each array element becomes a child element. The tag name defaults to 'item' but can be customized." },
    { question: "Is my data uploaded?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
  ],
};

export default data;
