import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Favicon?", content: "A favicon is the small icon displayed in browser tabs, bookmarks, and mobile home screens. Modern apps need multiple sizes: 16×16 for tabs, 180×180 for Apple Touch, and 512×512 for PWA manifests." },
  howToUse: "Upload any image (PNG, JPG, SVG, WebP). The tool generates all standard favicon sizes. Download individual sizes or all at once.",
  faqs: [
    { question: "What sizes are generated?", answer: "16, 32, 48, 64, 128, 180 (Apple Touch), 192, and 512 (PWA) pixels." },
    { question: "What format should my source image be?", answer: "Square images work best. PNG or SVG with transparent backgrounds are ideal." },
    { question: "Is my data uploaded?", answer: "No — all resizing uses the Canvas API in your browser." },
  ],
};

export default data;
