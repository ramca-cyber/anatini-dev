import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Image Compression?", content: "Image compression reduces file size by removing redundant data or reducing quality. Lossy compression (JPEG, WebP) achieves higher ratios by discarding some visual information. This tool uses the browser's Canvas API for fast, private compression." },
  howToUse: "Upload an image, choose the output format (JPEG, PNG, or WebP) and quality level. The tool instantly compresses and shows a side-by-side comparison with file size reduction percentage. Download the compressed image.",
  faqs: [
    { question: "Which format gives the best compression?", answer: "WebP typically offers 25-35% smaller files than JPEG at equivalent quality. JPEG is best for photos, PNG for graphics with transparency." },
    { question: "What's the maximum image size?", answer: "There's no hard limit, but very large images (50MP+) may be slow due to Canvas API constraints in the browser." },
    { question: "Is my image uploaded?", answer: "No — compression happens entirely in your browser using the Canvas API. Your images never leave your machine." },
  ],
};

export default data;
