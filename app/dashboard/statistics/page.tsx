import { redirect } from "next/navigation";

/** Legacy route — unified under /dashboard/analytics. */
export default function StatisticsRedirect() {
  redirect("/dashboard/analytics");
}
