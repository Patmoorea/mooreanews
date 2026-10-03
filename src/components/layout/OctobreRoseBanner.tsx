import { isOctobreRoseActive } from "@/lib/octobre-rose";

function RibbonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden
      className="mr-1.5 inline-block align-[-2px]"
    >
      <path
        fill="currentColor"
        d="M12 2.2c.4 1.7.2 3.1-.6 4.2-.7 1-1.7 1.6-2.6 2.1L7.2 21.2 12 18.4l4.8 2.8-1.6-12.7c-.9-.5-1.9-1.1-2.6-2.1-.8-1.1-1-2.5-.6-4.2z"
      />
      <path
        fill="currentColor"
        d="M8.2 7.4c-1.8.2-3.4-.2-4.6-1.2 1.5 2.2 2.2 3.6 2.2 5.1 0 .9-.3 1.7-.8 2.4L7.4 20l1.2-6.8c-.9-.8-1.5-1.8-1.5-3 0-1 .4-1.9 1.1-2.8zm7.6 0c.7.9 1.1 1.8 1.1 2.8 0 1.2-.6 2.2-1.5 3L16.6 20l2.4-6.3c-.5-.7-.8-1.5-.8-2.4 0-1.5.7-2.9 2.2-5.1-1.2 1-2.8 1.4-4.6 1.2z"
      />
    </svg>
  );
}

/** Une ligne, sans collecte de dons ni promesse médicale. */
export function OctobreRoseBanner() {
  if (!isOctobreRoseActive()) return null;

  return (
    <div className="no-print bg-lagon-800 text-white" role="note">
      <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-[13px] leading-snug sm:text-sm">
        <RibbonIcon />
        Octobre rose — MooreaNews porte le ruban rose.
      </p>
    </div>
  );
}
