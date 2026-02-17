import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a CSS Formatter?", content: "A CSS formatter takes messy, minified, or inconsistently indented CSS and restructures it with proper indentation, line breaks, and spacing. It can also minify CSS by removing all unnecessary whitespace and comments." },
  howToUse: "Paste CSS in the input area. Choose Format or Minify mode, select indentation (2 spaces, 4 spaces, or tabs), and the output updates live.",
  faqs: [
    { question: "Does it handle nested CSS?", answer: "Yes — it properly indents nested rules including media queries, keyframes, and container queries." },
    { question: "Are comments preserved?", answer: "Comments are removed during processing for cleaner output." },
    { question: "Is my data uploaded?", answer: "No — all formatting runs in your browser." },
  ],
};

export default data;
