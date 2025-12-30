import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedNav } from "@/components/protected-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    .select("id, name, photo_url")
    .eq("id", user.id)
    .single();

  if (!profile?.name) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <ProtectedNav user={profile} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">{children}</main>
    </div>
  );
}
