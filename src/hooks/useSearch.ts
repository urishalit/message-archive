import { useMemo, useEffect, useState, useRef } from "react";
import { RecipientDoc, ConversationDoc, MessageDoc } from "../types/firestore";
import firestore from "@react-native-firebase/firestore";

export interface SearchMessageResult {
  messageId: string;
  conversationId: string;
  conversationName: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

const MESSAGE_LIMIT = 50;
const DEBOUNCE_MS = 400;

export function useSearch(
  query: string,
  recipients: { id: string; data: RecipientDoc }[],
  conversations: { id: string; data: ConversationDoc }[]
) {
  const [messageResults, setMessageResults] = useState<SearchMessageResult[]>(
    []
  );
  const [searching, setSearching] = useState(false);
  const generationRef = useRef(0);

  const lowerQuery = query.toLowerCase().trim();

  const recipientResults = useMemo(() => {
    if (!lowerQuery) return [];
    return recipients.filter((r) =>
      r.data.nickname.toLowerCase().includes(lowerQuery)
    );
  }, [lowerQuery, recipients]);

  const conversationResults = useMemo(() => {
    if (!lowerQuery) return [];
    return conversations.filter((c) =>
      c.data.name.toLowerCase().includes(lowerQuery)
    );
  }, [lowerQuery, conversations]);

  useEffect(() => {
    if (lowerQuery.length < 2) {
      setMessageResults([]);
      setSearching(false);
      return;
    }

    const generation = ++generationRef.current;
    setSearching(true);

    const timeout = setTimeout(async () => {
      try {
        const results: SearchMessageResult[] = [];

        for (const convo of conversations) {
          if (results.length >= MESSAGE_LIMIT) break;

          const snap = await firestore()
            .collection("conversations")
            .doc(convo.id)
            .collection("messages")
            .get();

          if (generation !== generationRef.current) return;

          for (const doc of snap.docs) {
            if (results.length >= MESSAGE_LIMIT) break;
            const data = doc.data() as MessageDoc;
            if (data.content.toLowerCase().includes(lowerQuery)) {
              results.push({
                messageId: doc.id,
                conversationId: convo.id,
                conversationName: convo.data.name,
                content: data.content,
                senderId: data.senderId,
                timestamp: data.timestamp.toDate(),
              });
            }
          }
        }

        if (generation === generationRef.current) {
          setMessageResults(results);
          setSearching(false);
        }
      } catch {
        if (generation === generationRef.current) {
          setSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [lowerQuery, conversations]);

  return { recipientResults, conversationResults, messageResults, searching };
}
