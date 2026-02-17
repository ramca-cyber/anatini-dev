import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Unix Timestamp?", content: "A Unix timestamp (epoch time) counts the number of seconds since January 1, 1970 (UTC). It's the standard way computers represent time internally. This tool converts between epoch numbers and human-readable date formats." },
  howToUse: "Enter a Unix timestamp (seconds or milliseconds — auto-detected) or an ISO date string to see all date representations. Switch to Date → Epoch mode to convert a date picker value to timestamps. Click 'Now' for the current time.",
  faqs: [
    { question: "Does it handle milliseconds?", answer: "Yes — timestamps under 10^12 are treated as seconds, larger values as milliseconds. Both are converted correctly." },
    { question: "What timezone is used?", answer: "UTC is shown alongside your local timezone. ISO 8601 output is always in UTC (Z suffix)." },
    { question: "Is my data uploaded?", answer: "No — all conversion uses JavaScript's built-in Date object in your browser." },
  ],
};

export default data;
