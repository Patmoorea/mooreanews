import { countStaleFacebookImports } from "@/lib/facebook-legacy-import";
import { CleanupFacebookImportsButton } from "@/components/admin/CleanupFacebookImportsButton";

/** Bandeau visible uniquement s'il reste des imports Facebook obsolètes. */
export async function CleanupFacebookImportsBanner() {
  const staleCount = await countStaleFacebookImports();
  if (staleCount === 0) return null;
  return <CleanupFacebookImportsButton staleCount={staleCount} />;
}
