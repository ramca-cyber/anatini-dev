import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a UUID?", content: "A UUID (Universally Unique Identifier) is a 128-bit identifier guaranteed to be unique across time and space. UUIDv4 uses random numbers, while UUIDv7 embeds a timestamp for sortability — ideal for database primary keys." },
  howToUse: "Select v4 or v7, set the count (1-100), and click Generate. UUIDs are created instantly using crypto.randomUUID(). Copy individual UUIDs or all at once. Toggle uppercase formatting as needed.",
  faqs: [
    { question: "What's the difference between v4 and v7?", answer: "UUIDv4 is fully random. UUIDv7 embeds a Unix timestamp in the first 48 bits, making UUIDs sortable by creation time — better for database indexes." },
    { question: "Are these UUIDs truly unique?", answer: "Yes — with 122 random bits (v4) the probability of collision is astronomically low. You'd need to generate 1 billion UUIDs per second for 85 years to have a 50% chance of one collision." },
    { question: "Is my data uploaded?", answer: "No — UUIDs are generated using the Web Crypto API entirely in your browser." },
  ],
};

export default data;
