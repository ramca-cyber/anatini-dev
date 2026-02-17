import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is YAML to JSON Conversion?", content: "YAML is a human-readable data serialization format popular for configuration files, CI/CD pipelines, and Kubernetes manifests. Converting YAML to JSON lets you use that data in APIs, web applications, and tooling that expects JSON." },
  howToUse: "Paste your YAML input, choose an indentation level, and click Convert. Copy or download the resulting JSON.",
  faqs: [
    { question: "Does it support all YAML features?", answer: "Yes — anchors, aliases, multi-line strings, and all standard YAML 1.2 features are supported via the js-yaml library." },
    { question: "Is my data uploaded anywhere?", answer: "No — everything runs locally in your browser. No data is sent to any server." },
    { question: "Can I convert YAML with comments?", answer: "Comments are parsed but not preserved in the JSON output, since JSON doesn't support comments." },
  ],
};

export default data;
