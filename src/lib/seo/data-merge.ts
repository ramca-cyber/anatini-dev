import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Data Merging?", content: "Data merging (joining) combines rows from two datasets based on matching key columns. It's a fundamental operation in data analysis — equivalent to SQL JOINs but with a visual interface. Supports inner, left, right, full outer, and cross joins." },
  howToUse: "Upload two data files (left and right datasets). Select the join type and key columns to match on. The tool auto-detects common columns. Click 'Merge' to see the result. Download the merged data as CSV.",
  faqs: [
    { question: "What join types are supported?", answer: "Inner (only matching rows), Left (all left + matching right), Right (all right + matching left), Full Outer (all rows from both), and Cross (every combination)." },
    { question: "What happens with duplicate column names?", answer: "Columns from the right dataset that have the same name as left columns are automatically suffixed with '_right' to avoid ambiguity." },
    { question: "Can I merge files of different formats?", answer: "Yes — you can join a CSV with a Parquet file, or JSON with CSV. Any supported format combination works." },
  ],
};

export default data;
