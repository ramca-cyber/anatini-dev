import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Hash Generator?", content: "A hash generator computes a fixed-length cryptographic digest from input data. Hashes are one-way functions — you can't reverse them to get the original data. They're used for data integrity verification, password storage, digital signatures, and deduplication." },
  howToUse: "Type or paste text for instant hashing, or upload a file to hash its binary content. Select your algorithm (SHA-256, SHA-384, SHA-512). Copy the hex output.",
  faqs: [
    { question: "Which algorithm should I use?", answer: "SHA-256 is the most common and sufficient for most use cases. SHA-384 and SHA-512 provide longer hashes for higher security requirements." },
    { question: "Can I hash large files?", answer: "Yes — files are read as ArrayBuffers and hashed using the Web Crypto API. Very large files (100MB+) may take a moment." },
    { question: "Is MD5 supported?", answer: "MD5 is not included because it's cryptographically broken. Use SHA-256 or higher for security-sensitive hashing." },
  ],
};

export default data;
