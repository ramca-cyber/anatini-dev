import type { ToolSeoData } from "./types";

const data: ToolSeoData = {
  whatIs: { title: "What is SVG to PNG conversion?", content: "SVG (Scalable Vector Graphics) is a vector format that scales without losing quality. Converting SVG to PNG creates a raster image at a specific resolution — useful for sharing, uploading to platforms that don't support SVG, or using as app icons." },
  howToUse: "Upload an SVG file or paste SVG markup. Adjust the scale (1×–8×), toggle transparent background, and click Re-render. Download the PNG result.",
  faqs: [
    { question: "What scale should I use?", answer: "1× gives you the original SVG dimensions. 2× is good for retina displays. 4×–8× for high-resolution print or icons." },
    { question: "Is quality preserved?", answer: "SVG is vector, so the PNG is pixel-perfect at any scale. Higher scales produce larger, sharper images." },
    { question: "Is my data uploaded?", answer: "No — rendering happens entirely in your browser using the Canvas API." },
  ],
};

export default data;
