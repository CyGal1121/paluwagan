import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatContainer } from "@/components/chat";
import { MessageSquare } from "lucide-react";

interface ChatPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a member of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.status !== "active") {
    redirect("/home");
  }

  const isOrganizer = membership.role === "organizer";

  // Get group info
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-2 rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold">Group Chat</h1>
          <p className="text-xs text-muted-foreground">{group?.name}</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          groupId={groupId}
          currentUserId={user.id}
          isOrganizer={isOrganizer}
        />
      </div>
    </div>
  );
}
