import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        Learn more about this tool
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-6 rounded-lg border border-border bg-card p-6">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
