import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a URL Slug?", content: "A slug is the URL-friendly version of a title or name. It typically uses lowercase letters, numbers, and hyphens — removing special characters, diacritics, and spaces. Good slugs are readable, short, and SEO-friendly." },
  howToUse: "Type or paste titles (one per line). Choose separator (hyphen, underscore, dot), toggle lowercase, and set max length. Slugs generate automatically. Copy the results.",
  faqs: [
    { question: "How are accented characters handled?", answer: "Diacritics are stripped using Unicode normalization (NFD). 'café' becomes 'cafe'." },
    { question: "Can I process multiple titles at once?", answer: "Yes — enter one title per line and all slugs generate simultaneously." },
    { question: "Is my data uploaded?", answer: "No — all processing runs in your browser." },
  ],
};

export default data;
