import { Header } from "@/components/layout/Header";
import { Ticker } from "@/components/widgets/Ticker";

/** En-tête + bandeau défilant (météo, ferries…) — hauteur exposée pour l’admin */
export function SiteChrome() {
  return (
    <div className="sticky top-0 z-40 [--site-chrome-h:10.5rem] md:[--site-chrome-h:11.75rem]">
      <Header />
      <Ticker />
    </div>
  );
}
