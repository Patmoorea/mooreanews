export type GuideHit = {
  kind: "faq" | "info";
  title: string;
  excerpt: string;
  href: string;
  source?: string;
};

export { searchLocalAssistant as searchLocalGuide } from "@/lib/local-assistant";
