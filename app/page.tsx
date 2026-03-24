import { redirect } from "next/navigation";

export default function Home() {
  // Reindirizza direttamente alla dashboard principale di IterMed.
  redirect("/dashboard");
}
