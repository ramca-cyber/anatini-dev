import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a JavaScript Formatter?", content: "A JavaScript formatter restructures code with consistent indentation, line breaks after braces and semicolons, and proper spacing. Minification removes all unnecessary characters to reduce file size." },
  howToUse: "Paste JavaScript code, choose Format or Minify, select your indentation style, and the output updates live. Copy or download the result.",
  faqs: [
    { question: "Does it handle ES6+ syntax?", answer: "It handles braces, brackets, strings (including template literals), and comments. Complex syntax is preserved as-is." },
    { question: "Is it the same as Prettier?", answer: "This is a lightweight formatter for quick cleanup. For production use, consider Prettier or ESLint." },
    { question: "Is my data uploaded?", answer: "No — all formatting runs in your browser." },
  ],
};

export default data;
