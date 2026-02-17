import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Deduplication?", content: "Deduplication identifies and removes duplicate rows from a dataset. You define which columns determine uniqueness — rows with identical values in those columns are considered duplicates. You can keep the first or last occurrence of each duplicate group." },
  howToUse: "Upload a data file and select which columns define uniqueness (or use all columns). Choose whether to keep the first or last occurrence of duplicates. Click 'Find Duplicates' to see the count, preview removed rows, and download the cleaned file.",
  faqs: [
    { question: "What if I don't select any columns?", answer: "All columns are used to determine uniqueness — only rows that are completely identical across every column are considered duplicates." },
    { question: "What does 'Keep First' vs 'Keep Last' mean?", answer: "'Keep First' retains the earliest occurrence of each duplicate group (by row order). 'Keep Last' retains the latest occurrence." },
    { question: "Can I preview which rows are duplicates?", answer: "Yes — after running deduplication, expand the 'Preview duplicates' section to see which rows would be removed." },
  ],
};

export default data;
