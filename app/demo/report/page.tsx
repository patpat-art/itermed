import { AequanNavbar } from "@/components/layout/AequanNavbar";
import { AequanPerformanceReport } from "@/components/aequan/AequanPerformanceReport";
import { MOCK_EVALUATION_REPORT } from "@/lib/mock-data/aequan-mock-data";
import Link from "next/link";

export const metadata = {
  title: "AEQUAN · Report Post-Simulazione (Demo)",
  description: "Legal Shield, SSN Audit, Empathy analysis — local mock.",
};

export default function DemoReportPage() {
  return (
    <div className="min-h-dvh bg-ui-bg text-text-primary">
      <AequanNavbar
        trailing={
          <Link
            href="/demo"
            className="aequan-interactive rounded-aequan border border-brand-primary px-4 py-2 text-xs font-medium text-brand-primary hover:bg-brand-primary hover:text-white"
          >
            ← Torna alla Simulazione
          </Link>
        }
      />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AequanPerformanceReport report={MOCK_EVALUATION_REPORT} />
      </main>
    </div>
  );
}
