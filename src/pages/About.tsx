import { Bird, Shield, Code, Cpu } from "lucide-react";

export default function About() {
  return (
    <div className="container max-w-3xl py-16">
      <div className="flex items-center gap-3 mb-8">
        <Bird className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">About DuckTools</h1>
      </div>

      <div className="space-y-10">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Privacy First</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            DuckTools is a collection of browser-based data tools that process everything locally. 
            No data ever leaves your machine — there's no backend, no analytics, no tracking. 
            Every computation happens via WebAssembly right in your browser tab.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Tech Stack</h2>
          </div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><span className="font-mono text-sm text-foreground">DuckDB-WASM</span> — In-browser analytical SQL engine</li>
            <li><span className="font-mono text-sm text-foreground">React + TypeScript</span> — UI framework</li>
            <li><span className="font-mono text-sm text-foreground">Tailwind CSS</span> — Styling</li>
            <li><span className="font-mono text-sm text-foreground">Vite</span> — Build tool</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Code className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Open Source</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Built with open-source technologies. All processing is transparent and verifiable — 
            the code does exactly what it says, nothing more.
          </p>
        </section>
      </div>
    </div>
  );
}
