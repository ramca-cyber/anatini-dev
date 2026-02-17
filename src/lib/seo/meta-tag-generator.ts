import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What are Meta Tags?", content: "Meta tags are HTML elements that provide metadata about a web page. They help search engines understand your content, control social media previews (Open Graph, Twitter Cards), and set browser behavior like viewport and charset." },
  howToUse: "Fill in the form fields — title, description, URL, OG image, etc. The generated meta tags update live in the output panel. Copy or download the HTML snippet to paste into your page's <head>.",
  faqs: [
    { question: "What's the ideal title length?", answer: "Keep titles under 60 characters to avoid truncation in search results." },
    { question: "What's the ideal description length?", answer: "Keep meta descriptions under 160 characters for best display in search results." },
    { question: "Is my data uploaded?", answer: "No — all generation happens in your browser." },
  ],
};

export default data;
