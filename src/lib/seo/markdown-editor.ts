import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Markdown?", content: "Markdown is a lightweight markup language for formatting text. It uses simple syntax like # for headings, ** for bold, and - for lists. It's widely used in README files, documentation, blogs, and developer tools." },
  howToUse: "Type or paste Markdown in the editor. The preview updates in real time. Switch between Split, Edit, and Preview modes. Open .md files, copy HTML output, or download the Markdown file.",
  faqs: [
    { question: "Does it support GitHub-Flavored Markdown?", answer: "Yes — tables, task lists, strikethrough, and fenced code blocks are all supported via GFM." },
    { question: "Can I open existing .md files?", answer: "Yes — click 'Open .md' to load a Markdown file from your computer." },
    { question: "Is my data uploaded?", answer: "No — all rendering uses the marked library in your browser." },
  ],
};

export default data;
