import { useEffect, useState } from "react";
import { MessageDoc } from "../types/firestore";
import { subscribeToMessages } from "../services/firestore";

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<
    { id: string; data: MessageDoc }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversationId, (results) => {
      setMessages(results);
      setLoading(false);
    });
    return unsubscribe;
  }, [conversationId]);

  return { messages, loading };
}
