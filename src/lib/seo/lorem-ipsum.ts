import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is Lorem Ipsum?", content: "Lorem Ipsum is dummy text used in design and typesetting since the 1500s. It provides realistic-looking text without meaningful content, helping designers focus on visual layout rather than reading the copy." },
  howToUse: "Set the count and unit (paragraphs, sentences, or words). Toggle whether to start with the classic 'Lorem ipsum' opening. Copy the generated text for your mockups.",
  faqs: [
    { question: "Is it real Latin?", answer: "It's derived from a 1st-century BC text by Cicero, but scrambled and modified. It's not grammatically correct Latin." },
    { question: "Can I generate plain sentences?", answer: "Yes — switch the unit to 'Sentences' or 'Words' for shorter text blocks." },
    { question: "Is my data uploaded?", answer: "No — text is generated entirely in your browser." },
  ],
};

export default data;
