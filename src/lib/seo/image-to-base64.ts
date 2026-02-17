import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Image to Base64?", content: "Base64 encoding converts binary image data into ASCII text. Data URIs embed the encoded image directly in HTML or CSS, eliminating HTTP requests. This is useful for small icons, email templates, and single-file HTML pages." },
  howToUse: "Upload an image (PNG, JPG, GIF, WebP, SVG). The tool generates the Base64 string, data URI, and ready-to-use HTML/CSS snippets. Copy any format with one click.",
  faqs: [
    { question: "Will the Base64 be larger than the original?", answer: "Yes — Base64 encoding increases size by ~33%. It's best for small images under 10KB." },
    { question: "What formats are supported?", answer: "PNG, JPEG, GIF, WebP, SVG, ICO, and BMP." },
    { question: "Is my data uploaded?", answer: "No — the FileReader API processes everything in your browser." },
  ],
};

export default data;
