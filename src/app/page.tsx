import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  if (!profile?.name) {
    redirect("/onboarding");
  }

  redirect("/home");
}
