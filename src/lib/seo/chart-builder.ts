import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is the Chart Builder?", content: "The Chart Builder creates interactive visualizations from your data files. Choose chart type, X/Y axes, and instantly see results. Built with Recharts, it supports bar, line, area, pie, and scatter charts with PNG export." },
  howToUse: "Upload a data file, select the chart type, X axis column, and one or more Y axis columns. Click 'Build Chart' to render. Export as PNG for sharing or documentation.",
  faqs: [
    { question: "What chart types are available?", answer: "Bar, Line, Area, Pie, and Scatter charts. Multiple Y columns are supported for bar, line, and area charts." },
    { question: "Can I export the chart?", answer: "Yes — click 'Export PNG' to download a high-resolution PNG image of your chart." },
    { question: "How many data points can it handle?", answer: "Charts render up to 10,000 rows. For larger datasets, the tool automatically limits to the first N rows." },
  ],
};

export default data;
