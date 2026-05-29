/**
 * Types de la base Supabase MooreaNews.
 * Réfléchit le schéma défini dans supabase/schema.sql.
 *
 * Pour régénérer automatiquement :
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

export type Role = "user" | "editor" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[] | null;
  cover_url: string | null;
  author: string | null;
  author_id: string | null;
  featured: boolean;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string;
  district: string | null;
  organizer: string | null;
  price: string | null;
  contact: string | null;
  url: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  category: string;
  district: string | null;
  price: string | null;
  contact: string | null;
  author: string | null;
  cover_url: string | null;
  published: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RestaurantRow = {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  district: string;
  address: string;
  phone: string | null;
  hours: string | null;
  price_range: string | null;
  lat: number | null;
  lon: number | null;
  cover_url: string | null;
  url: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  price: string | null;
  duration: string | null;
  lat: number | null;
  lon: number | null;
  cover_url: string | null;
  url: string | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type InfoRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  emergency: boolean;
  url: string | null;
  lat: number | null;
  lon: number | null;
  map_icon_url: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type SubmissionRow = {
  id: string;
  type: "event" | "annonce" | "service" | "signalement" | "suggestion";
  district: string | null;
  title: string;
  description: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  cover_url: string | null;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  status: SubmissionStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  created_at: string;
};

export type ExternalArticleRow = {
  id: string;
  source_id: string;
  source_name: string;
  external_id: string;
  url: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string;
  fetched_at: string;
  hidden: boolean;
  promoted: boolean;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  confirmed: boolean;
  confirmation_token: string | null;
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
};

export type AlertType =
  | "coupure_eau"
  | "coupure_edt"
  | "route"
  | "houle"
  | "ferry"
  | "meteo"
  | "autre";

export type AlertSeverity = "info" | "warning" | "alert";

export type AlertRow = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  details: string | null;
  district: string | null;
  source_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  urgent: boolean;
  created_at: string;
  updated_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  districts: string[];
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type AlertEmailSubscriptionRow = {
  id: string;
  email: string;
  districts: string[];
  created_at: string;
};

type TableDef<TRow> = {
  Row: TRow;
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
  Relationships: [];
};

export type PageViewRow = {
  id: string;
  path: string;
  referrer: string | null;
  visitor_id: string | null;
  viewed_at: string;
};

export type Database = {
  public: {
    Tables: {
      page_views: TableDef<PageViewRow>;
      profiles: TableDef<Profile>;
      articles: TableDef<ArticleRow>;
      events: TableDef<EventRow>;
      announcements: TableDef<AnnouncementRow>;
      restaurants: TableDef<RestaurantRow>;
      activities: TableDef<ActivityRow>;
      info_pratiques: TableDef<InfoRow>;
      submissions: TableDef<SubmissionRow>;
      newsletter_subscribers: TableDef<NewsletterSubscriber>;
      external_articles: TableDef<ExternalArticleRow>;
      alerts: TableDef<AlertRow>;
      push_subscriptions: TableDef<PushSubscriptionRow>;
      alert_email_subscriptions: TableDef<AlertEmailSubscriptionRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
