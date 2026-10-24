import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ActualitesListing,
  ARTICLES_PER_PAGE,
  getListedArticles,
} from "@/components/ActualitesListing";
import { listingPageMetadata } from "@/lib/seo";

export const revalidate = 1800;

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return listingPageMetadata({
    title: `Actualités de Moorea — page ${n}`,
    description: `Archives des actualités de Moorea, page ${n}.`,
    path: `/actualites/page/${n}`,
    rssPath: "/actualites/feed.xml",
  });
}

export default async function ActualitesPageN({ params }: Props) {
  const { n } = await params;
  const page = Number(n);
  if (!Number.isInteger(page) || page < 1) notFound();
  if (page === 1) permanentRedirect("/actualites");
  const total = Math.ceil((await getListedArticles()).length / ARTICLES_PER_PAGE);
  if (page > Math.max(1, total)) notFound();
  return <ActualitesListing page={page} />;
}
