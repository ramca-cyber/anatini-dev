import { Link } from "react-router-dom";
import { PageMeta } from "@/components/shared/PageMeta";

export default function Privacy() {
  return (
    <div className="container py-8 max-w-3xl">
      <PageMeta
        title="Privacy Policy — Anatini.dev"
        description="Anatini.dev is a privacy-first developer tool suite. No data collection, no tracking, no cookies. Everything runs in your browser."
      />

      <h1 className="text-3xl font-bold tracking-tight mb-4">Privacy Policy</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Last updated: February 2026
      </p>

      <article className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-3">The Short Version</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>We don't collect your data. Period.</strong> Anatini.dev is a collection of 60+ developer tools that run <strong>entirely in your browser</strong>. No files are uploaded. No data is sent to any server. No cookies. No analytics. No tracking pixels. Close the tab and everything is gone.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">How It Works</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li><strong>Client-side processing:</strong> All tools run using JavaScript and WebAssembly (DuckDB-WASM) directly in your browser. Your files and data never leave your device.</li>
            <li><strong>No server-side logic:</strong> Anatini.dev is a static site. There is no backend, no database, no API that processes user data.</li>
            <li><strong>No uploads:</strong> When you "upload" a file, it's read into your browser's local memory using the File API. It is not transmitted anywhere.</li>
            <li><strong>No persistence:</strong> Nothing is stored between sessions. There is no localStorage usage for user data, no IndexedDB, no cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">What We Don't Collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>❌ Personal information (name, email, IP address)</li>
            <li>❌ Usage analytics or behavioral tracking</li>
            <li>❌ Files, text, or data you process with our tools</li>
            <li>❌ Cookies or tracking pixels</li>
            <li>❌ Device fingerprints</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anatini.dev does not integrate any third-party analytics, advertising, or tracking services. We do not use Google Analytics, Facebook Pixel, Hotjar, or any similar tools.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            The site is hosted on Lovable's infrastructure, which serves static files via CDN. The hosting provider may log standard web server access logs (IP address, user agent, timestamp) as part of normal CDN operation. Anatini.dev has no access to these logs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Open Source Verification</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can verify these claims yourself. Open your browser's DevTools → Network tab while using any tool. You'll see <strong>zero outgoing requests</strong> containing your data. The entire application is a static bundle of HTML, CSS, JavaScript, and WebAssembly files.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">GDPR / CCPA / HIPAA</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Because we don't collect, process, or store any personal data, Anatini.dev is inherently compliant with GDPR, CCPA, and similar data protection regulations. There is no data to request, export, or delete — because we never have it in the first place.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            While Anatini.dev is not a HIPAA-covered entity, the client-side architecture means protected health information (PHI) processed through our tools never leaves the user's device.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about this policy? Visit our <Link to="/about" className="text-primary hover:underline">About page</Link> for contact information.
          </p>
        </section>
      </article>
    </div>
  );
}