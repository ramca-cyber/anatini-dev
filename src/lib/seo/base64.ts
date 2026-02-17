import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Base64?", content: "Base64 is a binary-to-text encoding scheme that represents binary data as ASCII characters. It's commonly used to embed images in HTML/CSS, encode API credentials, transmit binary data in JSON, and handle email attachments." },
  howToUse: "Select Encode or Decode mode. Type or paste text to convert in real-time. Upload a file to encode its binary content as Base64. Copy or download the result.",
  faqs: [
    { question: "Can I encode binary files?", answer: "Yes — upload any file (images, PDFs, etc.) and the tool will encode its raw bytes to Base64." },
    { question: "What's the maximum file size?", answer: "There's no hard limit, but very large files (50MB+) may slow your browser since everything runs in memory." },
    { question: "Is my data uploaded?", answer: "No — all encoding and decoding happens locally in your browser. No data is sent anywhere." },
  ],
};

export default data;
