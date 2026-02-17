import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Word Counter?", content: "A word counter analyzes text to provide statistics like word count, character count, sentence count, paragraph count, and estimated reading/speaking time. Essential for writers, students, and content creators working with length requirements." },
  howToUse: "Type or paste text in the input area. All statistics update in real time — words, characters (with and without spaces), sentences, paragraphs, lines, bytes, reading time, and speaking time. View top word frequency below.",
  faqs: [
    { question: "How is reading time calculated?", answer: "Based on an average reading speed of 200 words per minute." },
    { question: "How is speaking time calculated?", answer: "Based on an average speaking speed of 130 words per minute." },
    { question: "Is my data uploaded?", answer: "No — all analysis runs in your browser." },
  ],
};

export default data;
