import { ArticleForm } from "@/components/admin/ArticleForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvel article" };

export default function NewArticlePage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("articles", formData);
  }

  return (
    <div>
      <AdminPageHeader
        title="Nouvel article"
        description="Rédiger un nouvel article éditorial"
      />
      <ArticleForm action={action} />
    </div>
  );
}
