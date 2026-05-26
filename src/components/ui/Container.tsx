import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "nav";
  size?: "narrow" | "default" | "wide";
};

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
};

export function Container({
  children,
  className,
  as: Tag = "div",
  size = "default",
}: Props) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizes[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
