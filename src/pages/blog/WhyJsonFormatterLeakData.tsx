import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function WhyJsonFormatterLeakData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Why Your JSON Formatter Might Be Leaking Your Data",
    "description": "Most online JSON formatters send your data to a server. Learn why client-side tools are safer and how to verify where your data goes.",
    "author": { "@type": "Organization", "name": "Anatini.dev" },
  };

  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="Why Your JSON Formatter Might Leak Data — Anatini.dev"
        description="Most online JSON formatters send your data to a server. Learn why client-side tools are safer and how to protect sensitive data."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">JSON Formatter Data Leaks</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Why Your JSON Formatter Might Be Leaking Your Data</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You paste an API response into a JSON formatter to make it readable. Seems harmless. But most online formatters <strong>send your data to a remote server</strong> for processing — and you'd never know unless you checked the network tab.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">The Problem: Server-Side Formatting</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Many popular JSON tools work by sending your input to a backend API. The server parses the JSON, formats it, and sends it back. This round-trip means your data — which might include <strong>API keys, tokens, PII, database records, or internal config</strong> — is transmitted over the internet and potentially logged.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Server logs:</strong> Your JSON could be stored in access logs, error logs, or analytics.</li>
          <li><strong>Third-party tracking:</strong> Many free tools are ad-supported and include trackers like Google Analytics, Hotjar, or Facebook Pixel — all of which can capture form inputs.</li>
          <li><strong>No encryption guarantee:</strong> Even over HTTPS, the server operator sees your plaintext data.</li>
          <li><strong>Compliance risk:</strong> Sending customer data to a random SaaS tool may violate GDPR, HIPAA, or SOC 2 policies.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-3">How to Check If a Tool Sends Your Data</h2>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-muted-foreground">
          <li><strong>Open DevTools → Network tab</strong> before pasting your JSON.</li>
          <li><strong>Paste and format.</strong> Watch for outgoing POST or GET requests.</li>
          <li><strong>Check the request payload.</strong> If you see your JSON in the request body, your data left the browser.</li>
          <li><strong>Look for analytics scripts.</strong> Tracking pixels and session recorders can capture keystrokes.</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">The Solution: Client-Side Only</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A truly client-side tool runs <strong>entirely in your browser</strong> using JavaScript. No server calls. No network requests. Your data stays in your browser's memory and disappears when you close the tab.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          JSON formatting is trivially done in the browser with <code className="bg-secondary px-1.5 py-0.5 text-xs">JSON.parse()</code> and <code className="bg-secondary px-1.5 py-0.5 text-xs">JSON.stringify()</code>. There is <strong>zero reason</strong> to send your data to a server for this task.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">What About More Complex Tools?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Even advanced operations like SQL queries, data profiling, and format conversion can run locally thanks to technologies like <strong>WebAssembly</strong> and <strong>DuckDB-WASM</strong>. Anatini.dev uses these technologies to power 60+ data tools — all running in your browser with zero server-side processing.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Quick Checklist for Evaluating Online Tools</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li>✅ Does it work with JavaScript disabled? (If yes, it's sending data to a server.)</li>
          <li>✅ Does the Network tab show API calls when you use it?</li>
          <li>✅ Does the privacy policy mention data processing or storage?</li>
          <li>✅ Is the source code available for inspection?</li>
          <li>✅ Does it load third-party tracking scripts?</li>
        </ul>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Try a JSON formatter that never sees your data</h3>
          <Link to="/json-formatter" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open JSON Formatter <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}