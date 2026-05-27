"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  enabled: boolean;
  message: string;
  href: string;
  variant: "info" | "warning" | "alert";
};

export function InfoBanner({ enabled, message, href, variant }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || !message || dismissed) return null;

  const variantClasses = {
    info: "bg-gradient-to-r from-lagon-500 to-ocean-600 text-white",
    warning: "bg-gradient-to-r from-soleil-400 to-couchant text-ocean-950",
    alert: "bg-gradient-to-r from-tiare-500 to-tiare-600 text-white",
  };

  const icons = {
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />,
    alert: <AlertCircle size={18} />,
  };

  const content = (
    <div className="flex items-center justify-center gap-2 text-sm font-medium">
      {icons[variant]}
      <span>{message}</span>
    </div>
  );

  return (
    <div className={cn("relative", variantClasses[variant])}>
      <div className="mx-auto max-w-7xl px-4 py-2.5 pr-12">
        {href ? (
          <Link href={href} className="block hover:opacity-90">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Fermer le bandeau"
      >
        <X size={16} />
      </button>
    </div>
  );
}
