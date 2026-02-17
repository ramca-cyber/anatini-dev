import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is .gitignore?", content: "A .gitignore file tells Git which files and directories to ignore when tracking changes. It prevents build artifacts, dependencies, secrets, and OS-specific files from being committed to version control." },
  howToUse: "Select one or more templates (Node.js, Python, macOS, IDEs, etc.). Add custom patterns if needed. The .gitignore content generates automatically. Copy or download the file.",
  faqs: [
    { question: "Can I combine multiple templates?", answer: "Yes — select as many templates as you need and they'll be combined into one .gitignore file." },
    { question: "Does it handle already-tracked files?", answer: "No — .gitignore only prevents untracked files from being added. Use 'git rm --cached' to untrack files already committed." },
    { question: "Is my data uploaded?", answer: "No — all generation happens in your browser." },
  ],
};

export default data;
