import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DashboardGuard } from "@/components/layout/DashboardGuard";
import { CopilotProvider } from "@/components/providers/CopilotProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CopilotProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <DashboardGuard>{children}</DashboardGuard>
        </main>
        <Footer />
      </div>
    </CopilotProvider>
  );
}
