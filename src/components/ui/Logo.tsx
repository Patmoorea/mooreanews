type Props = {
  size?: number;
  className?: string;
};

/**
 * Logo Moorea Hub : silhouette stylisée de l'île (forme de cœur)
 * sur fond dégradé tropical (lagon → tipanier → soleil → tiare).
 */
export function Logo({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-label="Moorea Hub"
      role="img"
    >
      <defs>
        <linearGradient id="moorea-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="35%" stopColor="#14b8a6" />
          <stop offset="65%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id="moorea-island" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Cercle dégradé tropical */}
      <circle cx="32" cy="32" r="30" fill="url(#moorea-bg)" />

      {/* Bord blanc subtil */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Silhouette de Moorea (forme de cœur inversé stylisé) */}
      <path
        d="M32 19
           C 26 19, 21 22, 19 27
           C 17 30, 17 34, 19 37
           C 21 40, 23 42, 25 44
           C 27 46, 30 48, 32 49
           C 34 48, 37 46, 39 44
           C 41 42, 43 40, 45 37
           C 47 34, 47 30, 45 27
           C 43 22, 38 19, 32 19 Z"
        fill="url(#moorea-island)"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Petit point central (point de référence) */}
      <circle cx="32" cy="34" r="1.4" fill="white" fillOpacity="0.8" />

      {/* Sommet du volcan (montagne) */}
      <path
        d="M28 36 L32 28 L36 36 Z"
        fill="white"
        fillOpacity="0.18"
      />
    </svg>
  );
}
