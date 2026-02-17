import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a QR Code?", content: "A QR (Quick Response) code is a two-dimensional barcode that can encode text, URLs, contact info, or any data up to ~4,296 characters. QR codes are widely used for sharing links, payments, and authentication." },
  howToUse: "Enter text or a URL and a QR code is generated instantly. Adjust the size and error correction level as needed. Download as PNG or copy to clipboard.",
  faqs: [
    { question: "What error correction levels are available?", answer: "Low (7%), Medium (15%), Quartile (25%), and High (30%). Higher levels make the code more resilient to damage but increase density." },
    { question: "What's the maximum data size?", answer: "QR codes can encode up to ~4,296 alphanumeric characters or ~2,953 bytes of binary data." },
    { question: "Is my data uploaded?", answer: "No — QR codes are generated entirely in your browser using the Canvas API." },
  ],
};

export default data;
