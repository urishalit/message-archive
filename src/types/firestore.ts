import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export type Platform = "whatsapp" | "telegram";

export interface RecipientDoc {
  originalIdentifier: string;
  nickname: string;
  platform: Platform;
  createdBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ConversationDoc {
  name: string;
  date: FirebaseFirestoreTypes.Timestamp;
  recipientIds: string[];
  uploaderId?: string;
  platform: Platform;
  importedBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  messageCount: number;
}

export interface MessageDoc {
  senderId: string;
  content: string;
  timestamp: FirebaseFirestoreTypes.Timestamp;
  order: number;
}
