import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Cron Expression?", content: "A cron expression is a string of five or six fields that defines a schedule for recurring tasks. Fields represent minute, hour, day of month, month, and day of week. Cron is used in Unix systems, CI/CD pipelines, and cloud schedulers." },
  howToUse: "Enter a cron expression (e.g., '0 9 * * 1-5') and the tool instantly explains it in plain English, shows the next scheduled run times, and validates the syntax. Common presets are available for quick reference.",
  faqs: [
    { question: "Does it support 6-field cron?", answer: "The tool primarily supports standard 5-field cron expressions. Some extended formats with seconds may be partially supported." },
    { question: "Can I see future run times?", answer: "Yes — the tool calculates and displays the next several scheduled execution times based on the current date." },
    { question: "Is my data uploaded?", answer: "No — all parsing happens locally in your browser. No data is sent to any server." },
  ],
};

export default data;
