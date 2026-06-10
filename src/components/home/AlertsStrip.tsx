import Link from "next/link";
import { ExternalLink, Siren } from "lucide-react";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { Container } from "@/components/ui/Container";

const TYPE_LABEL: Record<string, string> = {
  coupure_eau: "🚰 Coupure d'eau",
  coupure_edt: "⚡ Coupure électricité",
  route: "🚧 Route",
  houle: "🌊 Houle",
  ferry: "⛴ Ferry",
  meteo: "⛅ Météo",
  autre: "ℹ️ Info",
};

function alertSortPriority(type: string, urgent: boolean): number {
  if (type === "coupure_edt" || type === "coupure_eau") return 0;
  if (urgent) return 1;
  if (type === "meteo" || type === "ferry" || type === "houle") return 2;
  return 3;
}

export async function AlertsStrip() {
  await expirePastAlerts().catch(() => 0);
  const rows = (await dbListActiveAlerts()) ?? [];
  /** Coupures = bandeau rouge + pastille hero (pas de cartes en double). */
  const withoutOutages = rows.filter(
    (a) => a.type !== "coupure_edt" && a.type !== "coupure_eau",
  );
  const sorted = [...withoutOutages].sort(
    (a, b) =>
      alertSortPriority(a.type, a.urgent) -
        alertSortPriority(b.type, b.urgent) ||
      Number(b.urgent) - Number(a.urgent),
  );
  const items = sorted.slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section id="alertes-accueil" className="py-8 sm:py-10 scroll-mt-36 md:scroll-mt-44">
      <Container>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tiare-100 text-tiare-700 text-xs font-semibold uppercase tracking-widest border border-tiare-200/60">
              <Siren size={14} />
              Alertes
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl text-ocean-950">
              Infos importantes — coupures, météo, ferry
            </h2>
          </div>
          <Link
            href="/alertes"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-600"
          >
            Voir toutes
            <ExternalLink size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a, index) => {
            const isOutage =
              a.type === "coupure_edt" || a.type === "coupure_eau";
            const featured = isOutage && index === 0;
            const href = isOutage ? "/coupures" : "/alertes";

            return (
            <Link
              key={a.id}
              href={href}
              className={`group block rounded-2xl border p-4 sm:p-5 transition-all hover:-translate-y-0.5 ${
                featured
                  ? "sm:col-span-2 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-orange-300 ring-2 ring-orange-400/50 shadow-lg shadow-orange-200/40"
                  : isOutage
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 shadow-[var(--shadow-sunset)]"
                    : a.urgent
                      ? "bg-gradient-to-br from-tiare-50 to-soleil-50 border-tiare-200 shadow-[var(--shadow-sunset)]"
                      : "bg-white border-ocean-100 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] uppercase tracking-widest font-bold ${
                    isOutage ? "text-orange-800" : "text-ocean-600"
                  }`}
                >
                  {TYPE_LABEL[a.type] ?? a.type}
                </span>
                {featured ? (
                  <span className="text-[10px] uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    Important
                  </span>
                ) : a.urgent ? (
                  <span className="text-[10px] uppercase tracking-widest bg-tiare-600 text-white px-2 py-0.5 rounded-full">
                    Urgent
                  </span>
                ) : null}
              </div>
              <p
                className={`font-semibold text-ocean-900 leading-snug group-hover:text-tiare-700 transition-colors ${
                  featured ? "text-base sm:text-lg line-clamp-4" : "line-clamp-3"
                }`}
              >
                {a.title}
              </p>
              {a.details ? (
                <p
                  className={`mt-2 text-ocean-600 line-clamp-2 ${
                    featured ? "text-sm" : "text-xs"
                  }`}
                >
                  {a.details.replace(/<!--outage-sync:[^>]+-->/, "").trim()}
                </p>
              ) : null}
            </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/alertes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700"
          >
            Voir toutes les alertes
            <ExternalLink size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}

