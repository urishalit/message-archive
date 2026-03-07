import { useEffect, useState } from "react";
import { ConversationDoc } from "../types/firestore";
import {
  subscribeToConversationsForRecipient,
  subscribeToAllConversations,
} from "../services/firestore";

export function useConversations(recipientId?: string) {
  const [conversations, setConversations] = useState<
    { id: string; data: ConversationDoc }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = recipientId
      ? subscribeToConversationsForRecipient(recipientId, (results) => {
          setConversations(results);
          setLoading(false);
        })
      : subscribeToAllConversations((results) => {
          setConversations(results);
          setLoading(false);
        });
    return unsubscribe;
  }, [recipientId]);

  return { conversations, loading };
}
