import Link from "next/link";
import { ExternalLink, Siren } from "lucide-react";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { Container } from "@/components/ui/Container";

const TYPE_LABEL: Record<string, string> = {
  coupure_eau: "🚰 Eau",
  coupure_edt: "⚡ EDT",
  route: "🚧 Route",
  houle: "🌊 Houle",
  ferry: "⛴ Ferry",
  meteo: "⛅ Météo",
  autre: "ℹ️ Info",
};

export async function AlertsStrip() {
  await expirePastAlerts();
  const rows = (await dbListActiveAlerts()) ?? [];
  const urgent = rows.filter((a) => a.urgent).slice(0, 2);
  const rest = rows.filter((a) => !a.urgent).slice(0, 4 - urgent.length);
  const items = [...urgent, ...rest].slice(0, 4);

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
              Ce qui se passe maintenant
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
          {items.map((a) => (
            <Link
              key={a.id}
              href="/alertes"
              className={`group block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${
                a.urgent
                  ? "bg-gradient-to-br from-tiare-50 to-soleil-50 border-tiare-200 shadow-[var(--shadow-sunset)]"
                  : "bg-white border-ocean-100 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-ocean-600 font-semibold">
                  {TYPE_LABEL[a.type] ?? a.type}
                </span>
                {a.urgent ? (
                  <span className="text-[10px] uppercase tracking-widest bg-tiare-600 text-white px-2 py-0.5 rounded-full">
                    Breaking
                  </span>
                ) : null}
              </div>
              <p className="font-semibold text-ocean-900 leading-snug line-clamp-3 group-hover:text-tiare-700 transition-colors">
                {a.title}
              </p>
              {a.details ? (
                <p className="mt-2 text-xs text-ocean-600 line-clamp-2">
                  {a.details}
                </p>
              ) : null}
            </Link>
          ))}
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

