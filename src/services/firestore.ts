import firestore from "@react-native-firebase/firestore";
import {
  RecipientDoc,
  ConversationDoc,
  MessageDoc,
  Platform,
} from "../types/firestore";
import { ParsedMessage } from "../parsers/types";

const BATCH_LIMIT = 500;

// --- Recipients ---

export async function findRecipientByIdentifier(
  identifier: string,
  platform: Platform
): Promise<{ id: string; data: RecipientDoc } | null> {
  const snap = await firestore()
    .collection("recipients")
    .where("originalIdentifier", "==", identifier)
    .where("platform", "==", platform)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: doc.data() as RecipientDoc };
}

export async function getOrCreateRecipient(
  identifier: string,
  nickname: string,
  platform: Platform,
  userId: string
): Promise<string> {
  const existing = await findRecipientByIdentifier(identifier, platform);
  if (existing) return existing.id;

  const ref = await firestore()
    .collection("recipients")
    .add({
      originalIdentifier: identifier,
      nickname,
      nickname_lower: nickname.toLowerCase(),
      platform,
      createdBy: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  return ref.id;
}

export async function updateRecipientNickname(
  recipientId: string,
  nickname: string
) {
  await firestore().collection("recipients").doc(recipientId).update({
    nickname,
    nickname_lower: nickname.toLowerCase(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export function subscribeToRecipients(
  callback: (recipients: { id: string; data: RecipientDoc }[]) => void
) {
  return firestore()
    .collection("recipients")
    .orderBy("nickname_lower")
    .onSnapshot((snap) => {
      if (!snap) return;
      const results = snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as RecipientDoc,
      }));
      callback(results);
    });
}

// --- Conversations ---

export function subscribeToConversationsForRecipient(
  recipientId: string,
  callback: (convos: { id: string; data: ConversationDoc }[]) => void
) {
  return firestore()
    .collection("conversations")
    .where("recipientIds", "array-contains", recipientId)
    .orderBy("date", "desc")
    .onSnapshot((snap) => {
      if (!snap) return;
      const results = snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as ConversationDoc,
      }));
      callback(results);
    });
}

export function subscribeToAllConversations(
  callback: (convos: { id: string; data: ConversationDoc }[]) => void
) {
  return firestore()
    .collection("conversations")
    .orderBy("date", "desc")
    .onSnapshot((snap) => {
      if (!snap) return;
      const results = snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as ConversationDoc,
      }));
      callback(results);
    });
}

// --- Messages ---

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: { id: string; data: MessageDoc }[]) => void
) {
  return firestore()
    .collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .orderBy("order", "asc")
    .onSnapshot((snap) => {
      if (!snap) return;
      const results = snap.docs.map((doc) => ({
        id: doc.id,
        data: doc.data() as MessageDoc,
      }));
      callback(results);
    });
}

// --- Import (batch write) ---

export async function createConversationWithMessages(params: {
  name: string;
  date: Date;
  platform: Platform;
  recipientIds: string[];
  senderMap: Map<string, string>; // original identifier -> recipientId
  messages: ParsedMessage[];
  userId: string;
}): Promise<string> {
  const { name, date, platform, recipientIds, senderMap, messages, userId } =
    params;

  const convoRef = firestore().collection("conversations").doc();

  // Write conversation doc
  await convoRef.set({
    name,
    date: firestore.Timestamp.fromDate(date),
    recipientIds,
    platform,
    importedBy: userId,
    createdAt: firestore.FieldValue.serverTimestamp(),
    messageCount: messages.length,
  });

  // Batch write messages in chunks of 500
  for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
    const batch = firestore().batch();
    const chunk = messages.slice(i, i + BATCH_LIMIT);

    chunk.forEach((msg, idx) => {
      const msgRef = convoRef.collection("messages").doc();
      batch.set(msgRef, {
        senderId: senderMap.get(msg.sender) || "unknown",
        content: msg.content,
        timestamp: firestore.Timestamp.fromDate(msg.timestamp),
        order: i + idx,
      });
    });

    await batch.commit();
  }

  return convoRef.id;
}

export async function deleteConversation(conversationId: string) {
  // Delete all messages in subcollection first
  const messagesSnap = await firestore()
    .collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .get();

  for (let i = 0; i < messagesSnap.docs.length; i += BATCH_LIMIT) {
    const batch = firestore().batch();
    const chunk = messagesSnap.docs.slice(i, i + BATCH_LIMIT);
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await firestore().collection("conversations").doc(conversationId).delete();
}
