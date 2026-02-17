import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is URL Encoding?", content: "URL encoding (percent-encoding) converts special characters into a format that can be safely transmitted in URLs. Characters like spaces, ampersands, and Unicode are replaced with percent-encoded equivalents (e.g., space → %20)." },
  howToUse: "Paste text or a URL in the input area. Click Encode to percent-encode special characters, or Decode to convert percent-encoded text back to readable form. Supports both full URL encoding and component-only encoding.",
  faqs: [
    { question: "What's the difference between encodeURI and encodeURIComponent?", answer: "encodeURI preserves URL structure characters like :, /, and ?. encodeURIComponent encodes everything except letters, digits, and a few special characters — use it for query parameter values." },
    { question: "Does it handle Unicode?", answer: "Yes — Unicode characters are properly encoded using UTF-8 percent-encoding sequences." },
    { question: "Is my data uploaded?", answer: "No — encoding and decoding happen entirely in your browser using built-in JavaScript functions." },
  ],
};

export default data;
