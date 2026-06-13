import { redirect } from "next/navigation";

export default function Page() {
  // Redirect the root path to /home automatically
  redirect("/home");
}
