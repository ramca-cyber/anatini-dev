import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is chmod?", content: "chmod (change mode) is a Unix command that sets file permissions. Permissions control read (r), write (w), and execute (x) access for the file owner, group, and others. Permissions are expressed in octal (e.g., 755) or symbolic (e.g., rwxr-xr-x) notation." },
  howToUse: "Click permission checkboxes for Owner, Group, and Others. The octal and symbolic values update instantly. Use presets for common patterns like 644 (files) or 755 (directories). Copy the chmod command.",
  faqs: [
    { question: "What does 755 mean?", answer: "Owner can read/write/execute, group and others can read/execute. Common for directories and scripts." },
    { question: "What does 644 mean?", answer: "Owner can read/write, group and others can only read. Common for regular files." },
    { question: "Is my data uploaded?", answer: "No — all calculation happens in your browser." },
  ],
};

export default data;
