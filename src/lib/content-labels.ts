import type { Activity, Announcement, InfoPratique } from "@/lib/content-types";

export const ANNOUNCEMENT_TYPE_LABELS: Record<
  Announcement["type"],
  { label: string; variant: "tipanier" | "lagon" | "ocean" | "tiare" | "soleil" | "couchant" }
> = {
  vente: { label: "À vendre", variant: "tipanier" },
  achat: { label: "Recherche", variant: "lagon" },
  location: { label: "Location", variant: "ocean" },
  emploi: { label: "Emploi", variant: "tiare" },
  service: { label: "Service", variant: "soleil" },
  "perdu-trouve": { label: "Perdu/Trouvé", variant: "couchant" },
};

export const ACTIVITY_CATEGORY_LABELS: Record<Activity["category"], string> = {
  plongee: "Plongée",
  randonnee: "Randonnée",
  lagon: "Lagon",
  culture: "Culture",
  nature: "Nature",
  sport: "Sport",
  famille: "Famille",
};

export const INFO_CATEGORY_LABELS: Record<InfoPratique["category"], string> = {
  sante: "Santé",
  transport: "Transports",
  administration: "Administration",
  commerce: "Commerces",
  urgence: "Urgences",
  education: "Éducation",
};
