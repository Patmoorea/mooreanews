import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "sunset" | "outline" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
  prefetch?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagon-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-lagon-500 to-ocean-600 text-white shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgb(8_145_178/0.4)]",
  sunset:
    "bg-gradient-to-br from-orange-400 via-tiare-400 to-tiare-500 text-white shadow-[var(--shadow-sunset)] hover:-translate-y-0.5",
  outline:
    "border-2 border-ocean-700 text-ocean-800 hover:bg-ocean-700 hover:text-white",
  ghost: "text-ocean-700 hover:bg-ocean-100",
  soft: "bg-lagon-100 text-ocean-800 hover:bg-lagon-200",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

function isLinkProps(props: ButtonProps | LinkProps): props is LinkProps {
  return typeof (props as LinkProps).href === "string";
}

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    icon,
    children,
  } = props;

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (isLinkProps(props)) {
    const { href, target, rel, prefetch } = props;
    const isExternal = href.startsWith("http");
    return (
      <Link
        href={href}
        target={target ?? (isExternal ? "_blank" : undefined)}
        rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
        prefetch={prefetch}
        className={classes}
      >
        {icon}
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, icon: _i, children: _ch, ...rest } =
    props as ButtonProps;
  void _v;
  void _s;
  void _c;
  void _i;
  void _ch;

  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
