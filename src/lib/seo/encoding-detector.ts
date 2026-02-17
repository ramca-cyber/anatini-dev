import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Encoding Detection?", content: "Character encoding detection identifies how text is stored in a file — whether it's UTF-8, ASCII, ISO-8859-1, or another encoding. It also detects Byte Order Marks (BOM) and line ending styles (LF, CRLF, CR), which are critical for cross-platform compatibility." },
  howToUse: "Drop or upload any text file. The tool analyzes the raw bytes to detect the character encoding, presence of a BOM marker, and line ending format. Results show confidence levels and recommendations.",
  faqs: [
    { question: "How accurate is the detection?", answer: "Detection is heuristic-based and highly accurate for common encodings like UTF-8 and ASCII. Less common encodings may require manual verification." },
    { question: "What encodings are supported?", answer: "UTF-8, ASCII, ISO-8859-1 (Latin-1), UTF-16 (LE/BE), and Windows-1252 are the most commonly detected. BOM detection covers UTF-8, UTF-16, and UTF-32 variants." },
    { question: "Is my data uploaded?", answer: "No — all analysis happens locally in your browser. No data is sent to any server." },
  ],
};

export default data;
