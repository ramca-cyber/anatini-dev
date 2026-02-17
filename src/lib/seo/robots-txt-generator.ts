import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is robots.txt?", content: "robots.txt is a text file placed at the root of a website that tells search engine crawlers which pages they can or cannot access. It's part of the Robots Exclusion Protocol and is the first file crawlers check before indexing." },
  howToUse: "Choose a preset (Allow All, Block All, Block AI Crawlers, Standard) or build custom rules. Add user-agent directives, allow/disallow paths, sitemap URL, and crawl delay. Copy or download the result.",
  faqs: [
    { question: "Does robots.txt block indexing?", answer: "No — it only suggests crawlers not to access pages. To prevent indexing, use a noindex meta tag." },
    { question: "How do I block AI crawlers?", answer: "Use the 'Block AI Crawlers' preset to add rules for GPTBot, CCBot, anthropic-ai, and Google-Extended." },
    { question: "Is my data uploaded?", answer: "No — all generation happens in your browser." },
  ],
};

export default data;
