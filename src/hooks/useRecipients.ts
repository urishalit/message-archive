import { useEffect, useState } from "react";
import { RecipientDoc } from "../types/firestore";
import { subscribeToRecipients } from "../services/firestore";

export function useRecipients() {
  const [recipients, setRecipients] = useState<
    { id: string; data: RecipientDoc }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToRecipients((results) => {
      setRecipients(results);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { recipients, loading };
}
