"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

type Props = {
  defaultStart?: string;
  defaultEnd?: string;
};

export function StayDateFilter({ defaultStart, defaultEnd }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const start = params.get("du") ?? defaultStart ?? "";
  const end = params.get("au") ?? defaultEnd ?? "";

  function apply(du: string, au: string) {
    const q = new URLSearchParams();
    if (du) q.set("du", du);
    if (au) q.set("au", au);
    const qs = q.toString();
    router.push(qs ? `/evenements?${qs}` : "/evenements");
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 p-4 rounded-2xl bg-lagon-50 border border-lagon-200"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        apply(String(fd.get("du") ?? ""), String(fd.get("au") ?? ""));
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-ocean-800 w-full sm:w-auto">
        <Calendar size={16} />
        Mon séjour
      </div>
      <label className="text-xs text-ocean-600">
        Du
        <input
          type="date"
          name="du"
          defaultValue={start}
          className="mt-1 block rounded-lg border border-ocean-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs text-ocean-600">
        Au
        <input
          type="date"
          name="au"
          defaultValue={end}
          className="mt-1 block rounded-lg border border-ocean-200 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-ocean-900 text-white text-sm font-semibold hover:bg-ocean-800"
      >
        Filtrer l&apos;agenda
      </button>
      {(start || end) && (
        <button
          type="button"
          onClick={() => apply("", "")}
          className="text-xs text-ocean-500 hover:text-ocean-800 underline"
        >
          Effacer
        </button>
      )}
    </form>
  );
}
