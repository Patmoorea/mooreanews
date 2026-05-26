import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Articles — Admin",
  robots: { index: false, follow: false },
};

export default function AdminArticlesPage() {
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl text-ocean-950">Articles</h1>
      <p className="mt-3 text-ocean-700">
        Interface CRUD à connecter à Supabase en Phase 2. Pour l&apos;instant,
        éditez directement{" "}
        <code className="px-2 py-0.5 bg-ocean-100 rounded">
          data/articles.json
        </code>{" "}
        depuis GitHub : la modification est mise en ligne en 2 minutes
        automatiquement après commit.
      </p>
    </Container>
  );
}
