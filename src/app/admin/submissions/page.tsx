import {
  Check,
  X as XIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { approveSubmission, rejectSubmission } from "@/app/admin/actions";
import { formatDateFR, timeAgo } from "@/lib/utils";
import type { SubmissionStatus } from "@/lib/supabase/types";

export const metadata = { title: "Soumissions" };

const TYPE_LABEL: Record<string, string> = {
  event: "Événement",
  annonce: "Annonce",
  service: "Service",
  signalement: "Signalement",
  suggestion: "Suggestion",
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const { status = "pending" } = await searchParams;
  const supabase = await getServerSupabase();

  let query = supabase
    ?.from("submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (status !== "all" && query) {
    query = query.eq("status", status as SubmissionStatus);
  }
  const { data: rows } = (await query) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Soumissions communautaires"
        description="Contenus envoyés par les habitants depuis /soumettre"
      />

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <a
            key={s}
            href={`/admin/submissions?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              status === s
                ? "bg-gradient-to-r from-lagon-500 to-ocean-700 text-white"
                : "bg-white border border-ocean-200 text-ocean-700"
            }`}
          >
            {s === "pending"
              ? "En attente"
              : s === "approved"
                ? "Approuvées"
                : s === "rejected"
                  ? "Rejetées"
                  : "Toutes"}
          </a>
        ))}
      </div>

      {(rows ?? []).length === 0 ? (
        <div className="bg-white rounded-3xl border border-ocean-100 p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-ocean-600">Aucune soumission dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(rows ?? []).map((s) => (
            <article
              key={s.id}
              className="bg-white rounded-3xl border border-ocean-100 p-6 shadow-[var(--shadow-soft)]"
            >
              <header className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-lagon-100 text-lagon-700 text-[10px] uppercase font-bold tracking-wide">
                      {TYPE_LABEL[s.type] ?? s.type}
                    </span>
                    {s.status === "pending" && (
                      <span className="px-2 py-0.5 rounded-full bg-tiare-100 text-tiare-700 text-[10px] uppercase font-bold tracking-wide">
                        En attente
                      </span>
                    )}
                    {s.status === "approved" && (
                      <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-[10px] uppercase font-bold tracking-wide">
                        Approuvée
                      </span>
                    )}
                    {s.status === "rejected" && (
                      <span className="px-2 py-0.5 rounded-full bg-ocean-200 text-ocean-700 text-[10px] uppercase font-bold tracking-wide">
                        Rejetée
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl text-ocean-950">{s.title}</h2>
                </div>
                <time className="text-xs text-ocean-500" title={s.created_at}>
                  {timeAgo(s.created_at)}
                </time>
              </header>

              <p className="text-ocean-800 whitespace-pre-wrap">{s.description}</p>

              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ocean-600">
                <li className="inline-flex items-center gap-1.5">
                  <Mail size={12} />
                  <a
                    href={`mailto:${s.user_email}`}
                    className="text-lagon-600 hover:underline"
                  >
                    {s.user_email}
                  </a>{" "}
                  · {s.user_name}
                </li>
                {s.user_phone && (
                  <li className="inline-flex items-center gap-1.5">
                    <Phone size={12} />
                    {s.user_phone}
                  </li>
                )}
                {s.district && (
                  <li className="inline-flex items-center gap-1.5">
                    <MapPin size={12} />
                    {s.district}
                  </li>
                )}
                {s.date && (
                  <li className="inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDateFR(s.date)}
                    {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                  </li>
                )}
              </ul>

              {s.admin_notes && (
                <p className="mt-3 text-xs text-ocean-600 italic bg-ocean-50 rounded-lg p-2">
                  Note admin : {s.admin_notes}
                </p>
              )}

              {s.status === "pending" && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-ocean-100 pt-4">
                  <form
                    action={async (fd) => {
                      "use server";
                      await approveSubmission(s.id, fd);
                    }}
                    className="flex-1 min-w-[200px] flex gap-2"
                  >
                    <input
                      name="admin_notes"
                      placeholder="Note (optionnel)"
                      className="flex-1 px-3 py-2 text-sm bg-sable-50 border border-ocean-200 rounded-lg focus:outline-none focus:border-lagon-500"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-br from-tipanier-500 to-tipanier-700 text-white text-sm font-semibold"
                    >
                      <Check size={14} />
                      Approuver
                    </button>
                  </form>
                  <form
                    action={async (fd) => {
                      "use server";
                      await rejectSubmission(s.id, fd);
                    }}
                  >
                    <input type="hidden" name="admin_notes" value="" />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-tiare-100 text-tiare-700 text-sm font-semibold hover:bg-tiare-200"
                    >
                      <XIcon size={14} />
                      Rejeter
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
