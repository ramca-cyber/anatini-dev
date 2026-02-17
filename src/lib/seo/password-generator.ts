import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a Password Generator?", content: "A password generator creates random, unpredictable passwords using a cryptographically secure random number generator. Strong passwords combine uppercase, lowercase, digits, and symbols to resist brute-force attacks." },
  howToUse: "Adjust the length, character sets, and count. Passwords are generated instantly using crypto.getRandomValues(). Copy individual passwords or all at once. A strength meter shows the security level.",
  faqs: [
    { question: "How secure are the passwords?", answer: "Passwords are generated using the Web Crypto API (crypto.getRandomValues), which provides cryptographically secure random numbers — the same standard used by password managers." },
    { question: "What password length should I use?", answer: "16+ characters with mixed character types is recommended. For high-security accounts, use 20+ characters." },
    { question: "Are passwords stored anywhere?", answer: "No — passwords are generated in your browser's memory and never stored or transmitted." },
  ],
};

export default data;
