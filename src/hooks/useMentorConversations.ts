import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ConversationMessage = {
  r: "ai" | "me";
  t: string;
};

export type MentorConversation = {
  id: string;
  user_id: string;
  title: string;
  messages: ConversationMessage[];
  industry: string;
  created_at: string;
  updated_at: string;
};

const MAX_CONVERSATIONS = 5;

export function useMentorConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MentorConversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all conversations on mount
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("mentor_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(MAX_CONVERSATIONS);
      if (!alive) return;
      setConversations((data ?? []) as MentorConversation[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(
    async (industry: string, messages: ConversationMessage[], title: string) => {
      if (!user) return null;

      // Enforce max 5 — delete oldest if needed
      if (conversations.length >= MAX_CONVERSATIONS) {
        const oldest = conversations[conversations.length - 1];
        await supabase
          .from("mentor_conversations")
          .delete()
          .eq("id", oldest.id);
        setConversations((prev) => prev.filter((c) => c.id !== oldest.id));
      }

      const { data, error } = await supabase
        .from("mentor_conversations")
        .insert({
          user_id: user.id,
          title,
          messages: messages as any,
          industry,
        })
        .select()
        .single();

      if (error || !data) return null;
      const newConv = data as MentorConversation;
      setConversations((prev) => [newConv, ...prev]);
      return newConv;
    },
    [user, conversations]
  );

  // Update existing conversation messages
  const updateConversation = useCallback(
    async (id: string, messages: ConversationMessage[]) => {
      if (!user) return;
      await supabase
        .from("mentor_conversations")
        .update({ messages: messages as any })
        .eq("id", id)
        .eq("user_id", user.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, messages } : c))
      );
    },
    [user]
  );

  // Update title
  const updateTitle = useCallback(
    async (id: string, title: string) => {
      if (!user) return;
      await supabase
        .from("mentor_conversations")
        .update({ title })
        .eq("id", id)
        .eq("user_id", user.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    },
    [user]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase
        .from("mentor_conversations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    },
    [user]
  );

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    updateTitle,
    deleteConversation,
  };
}