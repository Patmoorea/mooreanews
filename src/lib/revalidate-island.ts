import { revalidatePath } from "next/cache";

/**
 * Accueil et surfaces qui reprennent le même digest.
 * À appeler après une écriture (cron, admin, webhook) : le repli ISR est de 1 h,
 * la publication doit rester visible tout de suite.
 */
export function revalidateIslandHome(): void {
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath("/app");
  revalidatePath("/ce-soir");
  revalidatePath("/visiteurs");
  revalidatePath("/visiteurs/pack-hebergeur");
  revalidatePath("/bus-moorea");
  revalidatePath("/api/home-highlights");
  revalidatePath("/api/moorea-du-jour");
  revalidatePath("/api/moorea-data");
}
