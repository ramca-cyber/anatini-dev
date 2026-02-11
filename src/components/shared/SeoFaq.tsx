import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

interface SeoFaqProps {
  whatIs?: { title: string; content: string };
  howToUse?: string;
  faqs: FaqItem[];
}

export function SeoFaq({ whatIs, howToUse, faqs }: SeoFaqProps) {
  const faqJsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <section className="space-y-6 rounded-lg border border-border bg-card p-6">
        {whatIs && (
          <div>
            <h2 className="text-lg font-semibold mb-2">{whatIs.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{whatIs.content}</p>
          </div>
        )}

        {howToUse && (
          <div>
            <h2 className="text-lg font-semibold mb-2">How to use this tool</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{howToUse}</p>
          </div>
        )}

        {faqs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">FAQ</h2>
            <Accordion type="multiple">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </section>
    </>
  );
}
