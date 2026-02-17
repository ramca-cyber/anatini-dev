import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Regex Tester?", content: "A regex tester lets you write and test regular expressions against sample text in real time. It highlights matches, shows capture groups, and provides match details — essential for building and debugging patterns." },
  howToUse: "Enter a regex pattern and flags, then type or paste test text. Matches are highlighted instantly. View capture groups, match positions, and count. Use presets for common patterns like email, URL, or IP addresses.",
  faqs: [
    { question: "Which regex flavor does it use?", answer: "JavaScript's built-in RegExp engine, which supports most common features including lookahead, lookbehind, named groups, and Unicode properties." },
    { question: "Does it support flags?", answer: "Yes — use g (global), i (case-insensitive), m (multiline), s (dotAll), and u (unicode) flags." },
    { question: "Is my data uploaded?", answer: "No — regex testing happens entirely in your browser. No data is sent to any server." },
  ],
};

export default data;
