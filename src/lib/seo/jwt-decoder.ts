import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is a JWT?", content: "A JSON Web Token (JWT) is a compact, URL-safe token format used for authentication and information exchange. It consists of three Base64URL-encoded parts: header (algorithm), payload (claims), and signature. This tool decodes the first two parts without verification." },
  howToUse: "Paste a JWT token and the header and payload are decoded instantly. Timestamp claims (iat, exp, nbf) are shown as human-readable dates. An expiration badge shows whether the token is still valid.",
  faqs: [
    { question: "Does it verify the signature?", answer: "No — this tool only decodes the header and payload. Signature verification requires the secret key or public key, which should never be shared in a browser tool." },
    { question: "Is it safe to paste my JWT here?", answer: "Yes — the token is decoded entirely in your browser using atob(). Nothing is sent to any server. However, never share JWTs in untrusted online tools." },
    { question: "What claims are annotated?", answer: "Standard time claims (iat, exp, nbf) are automatically converted to human-readable dates." },
  ],
};

export default data;
