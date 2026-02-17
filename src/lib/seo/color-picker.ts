import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Color Picker?", content: "A color picker lets you select, convert, and analyze colors across different formats (Hex, RGB, HSL). It also checks WCAG contrast ratios between color pairs to ensure text readability and accessibility compliance." },
  howToUse: "Enter a color in any format (hex, RGB, or HSL) or use the native color picker. The tool converts between all formats instantly. Add a second color to check WCAG contrast ratio and see text previews.",
  faqs: [
    { question: "What is WCAG contrast?", answer: "WCAG (Web Content Accessibility Guidelines) defines minimum contrast ratios: 4.5:1 for normal text (AA), 7:1 for enhanced (AAA). This ensures text is readable for people with visual impairments." },
    { question: "What color formats are supported?", answer: "Hex (#3b82f6), RGB (rgb(59, 130, 246)), and HSL (hsl(217, 91%, 60%)) formats." },
    { question: "Is my data uploaded?", answer: "No — all color conversion is pure math running in your browser." },
  ],
};

export default data;
