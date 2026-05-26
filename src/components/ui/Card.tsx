import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section";
};

export function Card({
  children,
  className,
  hover = true,
  as: Tag = "div",
}: Props) {
  return (
    <Tag
      className={cn(
        "bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-ocean-100 overflow-hidden",
        hover &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-tropical)]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6 pb-3 space-y-1", className)}>{children}</div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6 pt-3", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "font-display text-xl text-ocean-900 leading-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}
