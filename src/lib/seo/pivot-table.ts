import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Pivot Table?", content: "A pivot table reorganizes and summarizes data by grouping rows, spreading a column's distinct values across new columns, and aggregating values. It's the most powerful way to summarize large datasets without writing code." },
  howToUse: "Upload a data file. Select row fields (GROUP BY), a pivot column (whose values become new columns), a value column, and an aggregation function. Click 'Build Pivot' to generate the table. Download the result as CSV.",
  faqs: [
    { question: "How many distinct pivot values are supported?", answer: "Up to 50 distinct values in the pivot column. Columns with higher cardinality should be filtered or grouped first." },
    { question: "What aggregation functions are available?", answer: "Count, Sum, Average, Min, and Max. Choose based on whether your value column is numeric or categorical." },
    { question: "Can I use multiple row fields?", answer: "Yes — add multiple row fields to create a multi-level grouping, similar to nested GROUP BY in SQL." },
  ],
};

export default data;
