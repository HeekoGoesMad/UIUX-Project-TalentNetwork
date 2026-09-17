import { redirect } from "next/navigation";

export default function ContactRequestsPage() {
  redirect("/notifications?tab=contact-requests");
}
