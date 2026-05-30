import { SITE } from "@/lib/constants";

type QrProps = {
  url: string;
  label: string;
  caption?: string;
};

export function QrCard({ url, label, caption }: QrProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center text-center bg-white rounded-2xl border border-ocean-100 p-5 shadow-sm print:border-ocean-300 print:shadow-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt={`QR code ${label}`}
        width={160}
        height={160}
        className="rounded-lg"
      />
      <p className="mt-3 font-semibold text-ocean-900 text-sm">{label}</p>
      {caption && (
        <p className="mt-1 text-xs text-ocean-500 max-w-[200px]">{caption}</p>
      )}
      <p className="mt-2 text-[10px] text-ocean-400 break-all max-w-[200px]">
        {url.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );
}

export function VisitorsQrSection() {
  const base = SITE.url.replace(/\/$/, "");

  return (
    <section className="grid sm:grid-cols-3 gap-4">
      <QrCard
        url={`${base}/visiteurs`}
        label="Visiteurs Moorea"
        caption="À afficher en réception hôtel / pension"
      />
      <QrCard
        url={`${base}/#en-direct`}
        label="Ferries & météo"
        caption="Débarcadère Vaiare, comptoir ferry"
      />
      <QrCard
        url={`${base}/app`}
        label="App MooreaNews"
        caption="PWA — écran d'accueil"
      />
    </section>
  );
}
