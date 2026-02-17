import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Text Diff?", content: "Text diff compares two text blocks line by line, highlighting additions, deletions, and unchanged lines. It's essential for code review, document comparison, and tracking changes between versions." },
  howToUse: "Paste or type text in both the Original and Modified panels. The diff is computed automatically, showing a unified view with color-coded additions (green) and deletions (red). Copy the diff output in unified format.",
  faqs: [
    { question: "What algorithm does it use?", answer: "A Longest Common Subsequence (LCS) algorithm that produces optimal line-by-line diffs, similar to Git's diff output." },
    { question: "Can I compare files?", answer: "Currently supports pasted text. For file comparison, paste file contents into the text areas." },
    { question: "Is my data uploaded?", answer: "No — all comparison happens locally in your browser. No data is sent to any server." },
  ],
};

export default data;
