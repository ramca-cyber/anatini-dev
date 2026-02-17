import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Sitemap?", content: "An XML sitemap lists all important URLs on your website, helping search engines discover and index your content. It includes metadata like last modification date, change frequency, and priority for each URL." },
  howToUse: "Set your base URL, then add pages with their paths, last modified dates, change frequency, and priority. The XML sitemap generates live. Copy or download the sitemap.xml file.",
  faqs: [
    { question: "How many URLs can a sitemap have?", answer: "The protocol allows up to 50,000 URLs per sitemap and 50MB uncompressed. For larger sites, use a sitemap index." },
    { question: "Where should I put sitemap.xml?", answer: "At the root of your domain (e.g., https://example.com/sitemap.xml) and reference it in your robots.txt." },
    { question: "Is my data uploaded?", answer: "No — all generation happens in your browser." },
  ],
};

export default data;
