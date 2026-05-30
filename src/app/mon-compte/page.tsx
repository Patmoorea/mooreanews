import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Mes quartiers, alertes et favoris MooreaNews.",
  alternates: { canonical: "/mon-compte" },
};

export default async function MonComptePage() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return (
      <>
        <PageHeader title="Mon compte" description="Connexion requise." variant="lagon" />
        <Container className="py-12 text-center">
          <Link href="/auth/login" className="text-lagon-700 font-semibold hover:underline">
            Se connecter →
          </Link>
        </Container>
      </>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/mon-compte");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const favResult = await supabase
    .from("user_favorites")
    .select("entity_type, entity_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const favorites = favResult.error ? null : favResult.data;

  return (
    <>
      <PageHeader
        badge="Lecteur"
        title="Mon compte"
        description={profile?.email ?? user.email ?? ""}
        variant="lagon"
      />
      <Container className="py-12 sm:py-16 max-w-2xl">
        <p className="text-ocean-800">
          Bonjour {profile?.full_name ?? "lecteur"} 👋
        </p>

        <section className="mt-8">
          <h2 className="font-display text-lg text-ocean-950">Alertes & push</h2>
          <p className="mt-2 text-sm text-ocean-600">
            Choisissez vos quartiers et activez les notifications sur la page Alertes.
          </p>
          <Link
            href="/alertes"
            className="inline-block mt-3 text-sm font-semibold text-lagon-700 hover:underline"
          >
            Gérer mes alertes →
          </Link>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg text-ocean-950">Mes favoris</h2>
          {!favorites?.length ? (
            <p className="mt-2 text-sm text-ocean-600">
              Aucun favori pour l&apos;instant — explorez{" "}
              <Link href="/restaurants" className="text-lagon-700 hover:underline">
                restaurants
              </Link>
              ,{" "}
              <Link href="/evenements" className="text-lagon-700 hover:underline">
                événements
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-ocean-700">
              {favorites.map((f) => (
                <li key={`${f.entity_type}-${f.entity_id}`}>
                  {f.entity_type} — {f.entity_id}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-lg text-ocean-950">Mes publications</h2>
          <Link
            href="/soumettre"
            className="inline-block mt-2 text-sm font-semibold text-lagon-700 hover:underline"
          >
            Soumettre une info →
          </Link>
        </section>
      </Container>
    </>
  );
}
