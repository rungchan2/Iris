import { redirect } from "next/navigation";

export default function PhotographerAdminIndexPage() {
  // Redirect to dashboard by default
  redirect("/photographer-admin/dashboard");
}