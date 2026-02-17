import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Hex Viewer?", content: "A hex viewer displays the raw bytes of any file in hexadecimal format alongside their ASCII representation. This is essential for inspecting binary file formats, debugging encodings, analyzing file headers, and reverse-engineering data structures." },
  howToUse: "Drop any file onto the viewer. Navigate through the hex dump using page controls or jump to a specific byte offset. Each row shows 16 bytes in hex with their ASCII equivalents on the right.",
  faqs: [
    { question: "What file types can I view?", answer: "Any file — images, executables, Parquet files, ZIP archives, or any binary format. The viewer shows raw bytes regardless of file type." },
    { question: "Is there a file size limit?", answer: "Files up to 100MB are supported. The viewer paginates in 4KB pages so even large files remain responsive." },
    { question: "Is my data uploaded?", answer: "No — the file is read entirely in your browser. Nothing is sent to any server." },
  ],
};

export default data;
