import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";
import { Home, ChevronRight, ArrowRight } from "lucide-react";

export default function DecodeJwtWithoutServer() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Decode a JWT Without a Server",
    "description": "Learn how JWTs work and decode them entirely in your browser using base64url decoding. No server needed.",
    "step": [
      { "@type": "HowToStep", "name": "Understand the structure", "text": "A JWT has three base64url-encoded parts separated by dots: header, payload, and signature." },
      { "@type": "HowToStep", "name": "Decode header and payload", "text": "Use atob() or a browser tool to decode the first two parts from base64url to JSON." },
      { "@type": "HowToStep", "name": "Inspect the claims", "text": "Check iss, sub, exp, iat, and custom claims in the decoded payload." },
    ],
  };

  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="Decode JWT Without a Server — Anatini.dev"
        description="Learn how JWTs work and decode them entirely in your browser. No server, no installs. Understand header, payload, and signature."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Decode JWT Without a Server</span>
      </nav>

      <article className="prose-custom">
        <h1 className="text-3xl font-bold tracking-tight mb-4">How to Decode a JWT Without a Server</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          JSON Web Tokens (JWTs) are everywhere — authentication, API authorization, SSO. But you don't need a server, a library, or even an internet connection to read what's inside one. Here's how JWTs work and how to decode them in your browser.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">What Is a JWT?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A JWT is a compact, URL-safe string that carries claims (data) between parties. It consists of <strong>three parts</strong> separated by dots:
        </p>
        <div className="bg-secondary p-4 font-mono text-xs mb-4 overflow-x-auto">
          <span className="text-primary">eyJhbGciOiJIUzI1NiJ9</span>.<span className="text-accent-foreground">eyJzdWIiOiIxMjM0NTY3ODkwIn0</span>.<span className="text-muted-foreground">dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U</span>
        </div>
        <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Header:</strong> Algorithm and token type (e.g., <code className="bg-secondary px-1.5 py-0.5 text-xs">{`{"alg":"HS256","typ":"JWT"}`}</code>)</li>
          <li><strong>Payload:</strong> The claims — user ID, roles, expiration, etc.</li>
          <li><strong>Signature:</strong> Verifies the token hasn't been tampered with (requires the secret key).</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">Why You Can Decode Without a Server</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The header and payload are simply <strong>base64url-encoded JSON</strong>. They're not encrypted — anyone can read them. The signature only proves authenticity; it doesn't hide the contents. This is by design.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          To decode, you just need to:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
          <li>Split the JWT on <code className="bg-secondary px-1.5 py-0.5 text-xs">.</code> (dot).</li>
          <li>Replace <code className="bg-secondary px-1.5 py-0.5 text-xs">-</code> with <code className="bg-secondary px-1.5 py-0.5 text-xs">+</code> and <code className="bg-secondary px-1.5 py-0.5 text-xs">_</code> with <code className="bg-secondary px-1.5 py-0.5 text-xs">/</code> (base64url → base64).</li>
          <li>Run <code className="bg-secondary px-1.5 py-0.5 text-xs">atob()</code> to get the raw JSON string.</li>
          <li>Parse with <code className="bg-secondary px-1.5 py-0.5 text-xs">JSON.parse()</code>.</li>
        </ol>

        <h2 className="text-xl font-bold mt-8 mb-3">JavaScript Example</h2>
        <div className="bg-secondary p-4 font-mono text-xs mb-4 overflow-x-auto whitespace-pre">
{`function decodeJwt(token) {
  const [header, payload] = token.split('.').slice(0, 2);
  const decode = (str) =>
    JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));
  return { header: decode(header), payload: decode(payload) };
}`}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          That's it — five lines. No dependencies. No network calls. This is exactly what browser-based JWT decoders do under the hood.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-3">Common JWT Claims</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-2 border-border">
            <thead>
              <tr className="bg-secondary">
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Claim</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Full Name</th>
                <th className="border-2 border-border px-3 py-2 text-left font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr><td className="border-2 border-border px-3 py-2 font-mono">iss</td><td className="border-2 border-border px-3 py-2">Issuer</td><td className="border-2 border-border px-3 py-2">Who created the token</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-mono">sub</td><td className="border-2 border-border px-3 py-2">Subject</td><td className="border-2 border-border px-3 py-2">The user or entity the token is about</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-mono">exp</td><td className="border-2 border-border px-3 py-2">Expiration</td><td className="border-2 border-border px-3 py-2">Unix timestamp when the token expires</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-mono">iat</td><td className="border-2 border-border px-3 py-2">Issued At</td><td className="border-2 border-border px-3 py-2">Unix timestamp when the token was created</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-mono">aud</td><td className="border-2 border-border px-3 py-2">Audience</td><td className="border-2 border-border px-3 py-2">Intended recipient of the token</td></tr>
              <tr><td className="border-2 border-border px-3 py-2 font-mono">nbf</td><td className="border-2 border-border px-3 py-2">Not Before</td><td className="border-2 border-border px-3 py-2">Token is not valid before this time</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-3">Security Reminders</h2>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Never paste JWTs into server-based tools.</strong> The token contains your identity and possibly access privileges.</li>
          <li><strong>Decoding ≠ verifying.</strong> Anyone can decode a JWT. Verifying the signature requires the secret key and should only happen server-side.</li>
          <li><strong>Check expiration.</strong> The <code className="bg-secondary px-1.5 py-0.5 text-xs">exp</code> claim is a Unix timestamp — compare it to the current time to know if the token is still valid.</li>
          <li><strong>Don't store secrets in JWTs.</strong> Payloads are readable by anyone. Never put passwords, API keys, or sensitive data in claims.</li>
        </ul>

        <div className="mt-10 border-2 border-border bg-secondary p-6">
          <h3 className="font-bold mb-2">Decode a JWT right now — 100% in your browser</h3>
          <Link to="/jwt-decoder" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            Open JWT Decoder <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}