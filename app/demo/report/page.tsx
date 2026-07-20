import { AequanPerformanceReport } from "@/components/aequan/AequanPerformanceReport";
import { MOCK_EVALUATION_REPORT } from "@/lib/mock-data/aequan-mock-data";
import Link from "next/link";

export const metadata = {
  title: "AEQUAN · Report Post-Simulazione (Demo)",
  description: "Legal Shield, SSN Audit, Empathy analysis — local mock.",
};

export default function DemoReportPage() {
  return (
    <div className="min-h-screen w-full bg-ui-bg text-text-primary">
      <div className="border-b border-border bg-panel-bg px-4 py-3 md:px-6">
        <Link
          href="/demo"
          className="aequan-interactive inline-flex rounded-xl border border-brand-primary px-4 py-2 text-xs font-medium text-brand-primary hover:bg-brand-primary hover:text-white"
        >
          ← Torna alla Simulazione
        </Link>
      </div>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 pb-12">
        <AequanPerformanceReport report={MOCK_EVALUATION_REPORT} />
      </main>
    </div>
  );
}
