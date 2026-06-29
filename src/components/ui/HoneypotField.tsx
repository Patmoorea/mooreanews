import { HONEYPOT_FIELD_NAME } from "@/lib/spam-guard";

/** Champ piège anti-bot — ne pas retirer. */
export function HoneypotField() {
  return (
    <div
      className="absolute left-[-9999px] h-0 w-0 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      <label htmlFor="hp-website">Ne pas remplir</label>
      <input
        type="text"
        id="hp-website"
        name={HONEYPOT_FIELD_NAME}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
