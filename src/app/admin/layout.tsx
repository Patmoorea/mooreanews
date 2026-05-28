import { Container } from "@/components/ui/Container";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: { template: "%s — Admin MooreaNews", default: "Admin MooreaNews" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-ocean-50 to-white min-h-screen">
      <Container className="py-8 sm:py-10 scroll-mt-[var(--site-chrome-h,11.75rem)]">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </Container>
    </div>
  );
}
