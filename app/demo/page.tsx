import { AequanClinicalWorkspace } from "@/components/aequan/AequanClinicalWorkspace";

export const metadata = {
  title: "AEQUAN · Simulazione Clinica (Demo)",
  description: "Dual-pane clinical workspace — local mock data only.",
};

/** Local UI/UX demo — no remote LLM/RAG. API base: localhost:8000 */
export default function DemoPage() {
  return <AequanClinicalWorkspace />;
}
