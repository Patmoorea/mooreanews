import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Éditer l'article" };

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!article) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateContent("articles", id, formData);
  }

  return (
    <div>
      <AdminPageHeader
        title="Éditer l'article"
        description={article.title}
      />
      <ArticleForm action={action} initial={article} />
    </div>
  );
}
