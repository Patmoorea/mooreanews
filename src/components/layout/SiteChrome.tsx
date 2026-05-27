import { Header } from "@/components/layout/Header";
import { Ticker } from "@/components/widgets/Ticker";

/** En-tête + bandeau défilant (météo, ferries…) collés sous le menu */
export function SiteChrome() {
  return (
    <div className="sticky top-0 z-50">
      <Header />
      <Ticker />
    </div>
  );
}
