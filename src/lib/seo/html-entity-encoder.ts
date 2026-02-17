import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What are HTML Entities?", content: "HTML entities are special codes used to represent characters that have special meaning in HTML (like < and >) or aren't on a standard keyboard (like © or €). They start with & and end with ; — e.g., &amp; for &." },
  howToUse: "Paste text and choose Encode or Decode. In encode mode, choose 'Special Only' (just HTML-special chars) or 'All Non-ASCII' (every non-ASCII character). Use the reference table to copy common entities.",
  faqs: [
    { question: "When should I encode HTML entities?", answer: "When displaying user input in HTML to prevent XSS attacks, or when you need special characters in HTML source code." },
    { question: "What's the difference between named and numeric entities?", answer: "Named entities (like &amp;) are human-readable. Numeric entities (like &#38;) work for any Unicode character." },
    { question: "Is my data uploaded?", answer: "No — all encoding runs in your browser." },
  ],
};

export default data;
