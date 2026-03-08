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

export async function findRecipientsByIdentifiers(
  identifiers: string[],
  platform: Platform
): Promise<Map<string, { id: string; data: RecipientDoc }>> {
  const results = new Map<string, { id: string; data: RecipientDoc }>();
  // Firestore 'in' queries support up to 30 values
  for (let i = 0; i < identifiers.length; i += 30) {
    const chunk = identifiers.slice(i, i + 30);
    const snap = await firestore()
      .collection("recipients")
      .where("originalIdentifier", "in", chunk)
      .where("platform", "==", platform)
      .get();
    for (const doc of snap.docs) {
      const data = doc.data() as RecipientDoc;
      results.set(data.originalIdentifier, { id: doc.id, data });
    }
  }
  return results;
}

export async function findUploaderForRecipient(
  recipientId: string
): Promise<boolean> {
  const snap = await firestore()
    .collection("conversations")
    .where("uploaderId", "==", recipientId)
    .limit(1)
    .get();
  return !snap.empty;
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

export async function fetchAllMessagesForConversation(
  conversationId: string
): Promise<{ id: string; data: MessageDoc }[]> {
  const snap = await firestore()
    .collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .get();
  return snap.docs.map((doc) => ({
    id: doc.id,
    data: doc.data() as MessageDoc,
  }));
}

// --- Import (batch write) ---

export async function createConversationWithMessages(params: {
  name: string;
  date: Date;
  platform: Platform;
  recipientIds: string[];
  uploaderId?: string;
  senderMap: Map<string, string>; // original identifier -> recipientId
  messages: ParsedMessage[];
  userId: string;
}): Promise<string> {
  const { name, date, platform, recipientIds, uploaderId, senderMap, messages, userId } =
    params;

  const convoRef = firestore().collection("conversations").doc();

  // Write conversation doc
  await convoRef.set({
    name,
    date: firestore.Timestamp.fromDate(date),
    recipientIds,
    ...(uploaderId ? { uploaderId } : {}),
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

export async function updateMessageContent(
  conversationId: string,
  messageId: string,
  content: string
) {
  await firestore()
    .collection("conversations")
    .doc(conversationId)
    .collection("messages")
    .doc(messageId)
    .update({ content });
}

export async function deleteMessages(
  conversationId: string,
  messageIds: string[]
) {
  const convoRef = firestore().collection("conversations").doc(conversationId);

  for (let i = 0; i < messageIds.length; i += BATCH_LIMIT) {
    const batch = firestore().batch();
    const chunk = messageIds.slice(i, i + BATCH_LIMIT);
    for (const id of chunk) {
      batch.delete(convoRef.collection("messages").doc(id));
    }
    await batch.commit();
  }

  await convoRef.update({
    messageCount: firestore.FieldValue.increment(-messageIds.length),
  });
}

export async function deleteConversation(conversationId: string) {
  // Read conversation data before deleting so we can clean up orphaned recipients
  const convoDoc = await firestore()
    .collection("conversations")
    .doc(conversationId)
    .get();
  const recipientIds: string[] = convoDoc.data()?.recipientIds || [];

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

  // Clean up orphaned recipients (those with no remaining conversations)
  for (const rid of recipientIds) {
    const remaining = await firestore()
      .collection("conversations")
      .where("recipientIds", "array-contains", rid)
      .limit(1)
      .get();
    if (remaining.empty) {
      await firestore().collection("recipients").doc(rid).delete();
    }
  }
}

export async function deleteRecipient(recipientId: string) {
  // Delete all conversations that include this recipient
  const convosSnap = await firestore()
    .collection("conversations")
    .where("recipientIds", "array-contains", recipientId)
    .get();

  for (const convoDoc of convosSnap.docs) {
    await deleteConversation(convoDoc.id);
  }

  // Delete the recipient doc
  await firestore().collection("recipients").doc(recipientId).delete();
}
