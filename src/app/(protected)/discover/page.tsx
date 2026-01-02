import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DiscoverContent } from "./discover-content";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Discover Branches | Pinoy Paluwagan",
  description: "Find and join paluwagan branches near you",
};

export default async function DiscoverPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover Branches</h1>
        <p className="text-muted-foreground">
          Find and join paluwagan branches near your location
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DiscoverContent />
      </Suspense>
    </div>
  );
}
