import Link from "next/link";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  image?: string | null;
  imageAlt?: string;
  children: React.ReactNode;
  className?: string;
};

/** Carte publication (annonce, événement…) avec affiche en tête si présente. */
export function PublicationCard({
  href,
  title,
  image,
  imageAlt,
  children,
  className,
}: Props) {
  const poster = hasPoster(image);

  return (
    <Link
      href={href}
      className={cn(
        "group block bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:border-tiare-200 hover:-translate-y-0.5 transition-all",
        className,
      )}
    >
      {poster ? (
        <PosterImage
          src={image!}
          alt={imageAlt ?? `Affiche — ${title}`}
          className="w-full aspect-[3/4] max-h-56 rounded-none border-0 border-b border-ocean-100"
        />
      ) : null}
      <div className={cn(poster ? "p-5" : "p-5 sm:p-6")}>{children}</div>
    </Link>
  );
}
