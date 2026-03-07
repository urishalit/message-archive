# Message Archive - Android App Plan

## Context

Build a React Native (Expo) Android app that lets users import WhatsApp/Telegram chat exports, assign nicknames to recipients (hiding original identifiers), organize conversations into named pages, and view them in a familiar chat-bubble UI. All authenticated users share the same data via Firebase.

## Tech Stack

- **React Native** via Expo (managed workflow + dev-client)
- **Expo Router** for file-based navigation
- **TypeScript**
- **Firebase**: Auth (Google Sign-In), Firestore, Storage
- **expo-share-intent** for Android share target

> **Note:** Expo Go won't work — native Firebase + share-intent require `expo-dev-client` with `npx expo run:android` or EAS Build.

---

## Firestore Data Model

```
/users/{userId}
  uid, email, displayName, photoURL, createdAt

/recipients/{recipientId}
  originalIdentifier   # phone or Telegram ID (NEVER shown in UI)
  nickname             # displayed everywhere
  platform             # "whatsapp" | "telegram"
  createdBy, createdAt, updatedAt

/conversations/{conversationId}
  name                 # user-given page name
  date                 # conversation date
  recipientIds[]       # involved recipients
  platform, importedBy, createdAt, messageCount

/conversations/{conversationId}/messages/{messageId}
  senderId             # -> recipientId
  content, timestamp, order
```

Key decisions:
- Messages as subcollection for scalability
- `originalIdentifier` only on recipient doc, never exposed to UI
- Data is shared across all authenticated users (not scoped per user)

---

## Project Structure

```
message-archive/
├── app/                              # Expo Router
│   ├── _layout.tsx                   # Root: ShareIntentProvider + AuthProvider
│   ├── +native-intent.ts            # Share intent redirect
│   ├── index.tsx                     # Auth gate
│   ├── login.tsx                     # Google Sign-In
│   ├── (tabs)/
│   │   ├── home.tsx                 # Recipients/groups list
│   │   └── settings.tsx             # Sign out, manage account
│   ├── recipient/[recipientId].tsx  # Conversations for a recipient
│   ├── conversation/[conversationId].tsx  # Chat bubble view
│   ├── import/
│   │   ├── index.tsx                # File picker / share-intent landing
│   │   ├── select-range.tsx         # Date+time range picker + preview
│   │   └── confirm.tsx              # Name page + assign nicknames + save
│   └── recipients/edit.tsx          # Manage all nicknames
├── src/
│   ├── providers/AuthProvider.tsx
│   ├── parsers/
│   │   ├── whatsapp.ts             # Regex-based .txt parser
│   │   ├── telegram.ts             # JSON parser
│   │   ├── types.ts                # ParsedMessage, ParsedChat
│   │   └── index.ts                # Auto-detect format + dispatch
│   ├── services/
│   │   ├── firestore.ts            # All CRUD + batch writes
│   │   └── auth.ts                 # Google sign-in logic
│   ├── components/
│   │   ├── ChatBubble.tsx           # Colored by sender
│   │   ├── ChatView.tsx             # FlatList of bubbles
│   │   ├── RecipientCard.tsx
│   │   ├── ConversationCard.tsx
│   │   └── DateRangePicker.tsx
│   ├── hooks/                       # useAuth, useRecipients, useConversations, useMessages
│   ├── utils/colors.ts             # Deterministic color from recipientId hash
│   └── types/firestore.ts          # TS interfaces
└── firebaseConfig.ts
```

---

## Key Packages

- `expo`, `expo-router`, `expo-dev-client`
- `@react-native-firebase/app`, `/auth`, `/firestore`, `/storage`
- `@react-native-google-signin/google-signin`
- `expo-share-intent` — registers as Android share target
- `expo-document-picker`, `expo-file-system`
- `@react-native-community/datetimepicker`

---

## Screens

| Screen | Purpose |
|--------|---------|
| `/login` | Google Sign-In button |
| `/(tabs)/home` | List recipients/groups with nickname + conversation count. FAB for import. |
| `/(tabs)/settings` | Sign out, link to nickname management |
| `/recipient/[id]` | Conversations for a recipient — name, date, message count per card |
| `/conversation/[id]` | Chat bubble view — colored per sender, nickname + timestamp |
| `/import` | Entry: file picker or share-intent landing, auto-detect format, parse |
| `/import/select-range` | Date+time pickers, shows first/last message preview |
| `/import/confirm` | Name the page, assign nicknames for new senders, save to Firestore |
| `/recipients/edit` | Manage all nicknames (inline editing) |

---

## Chat Parsing

**WhatsApp (.txt):** Regex-based, handles locale variants (DD/MM/YYYY, MM/DD/YY, 12h/24h). Multi-line messages handled by checking if a line matches the timestamp pattern. System messages skipped.

**Telegram (JSON):** Parse `result.json`, filter `type === "message"`, use `from_id` as identifier. Handle `text` being a string or array of mixed strings/objects (flatten to plain text).

**Format detection:** If content starts with `{` or `[` -> Telegram JSON, otherwise -> WhatsApp.

---

## Share Intent Flow

1. User exports chat from WhatsApp/Telegram -> shares to Message Archive
2. `expo-share-intent` catches `ACTION_SEND`, delivers file URI
3. `+native-intent.ts` redirects to `/import`
4. Import screen reads file, parses, proceeds to range selection
5. Edge case: if user not authenticated, store pending file URI, redirect to login, then resume import

---

## Implementation Phases

### Phase 1: Scaffolding + Auth
- Create Expo project, install packages
- Firebase project setup (google-services.json, enable Auth + Firestore)
- AuthProvider + Google Sign-In + login screen + auth gate

### Phase 2: Data Layer
- TypeScript interfaces for Firestore docs
- `firestore.ts` service: CRUD for recipients, conversations, messages
- Batch writes chunked at 500 (Firestore limit)
- Recipient deduplication (normalize phone numbers)

### Phase 3: Parsers
- WhatsApp parser with flexible regex
- Telegram JSON parser with rich-text flattening
- Unit tests with sample exports

### Phase 4: Import Flow
- File picker + file reading
- Date/time range selector with first/last message preview
- Confirm screen: name page, assign nicknames, save to Firestore

### Phase 5: Display Screens
- Home (recipients list), Recipient (conversations list)
- Chat view with colored bubbles, nickname + timestamp
- Nickname management screen

### Phase 6: Share Intent
- Configure `expo-share-intent` plugin
- Wire `+native-intent.ts` and `useShareIntentContext`
- Test end-to-end on real device

### Phase 7: Polish
- Loading/empty states, error handling
- Handle unauthenticated share intent
- Test on Android 12+

---

## Key Pitfalls to Watch

1. **Must use dev-client**, not Expo Go (native modules)
2. **WhatsApp date format** is locale-dependent — parser needs flexibility
3. **Firestore batch limit** is 500 ops — chunk large imports
4. **Phone number normalization** for recipient dedup
5. **Telegram `text` field** can be string or array — must handle both
6. **Never display `originalIdentifier`** — always resolve through nickname
7. **Share intent while logged out** — must queue and resume after auth

---

## Verification

1. Build dev client: `npx expo run:android`
2. Sign in with Google on a real device/emulator with Play Services
3. Import a WhatsApp `.txt` export via file picker -> verify parsing, range selection, page creation
4. Import a Telegram `result.json` -> same flow
5. View conversation in chat bubble UI -> verify colors, nicknames, timestamps
6. Edit a nickname -> verify it updates across all conversations
7. Export a chat from WhatsApp on device -> share to app -> verify share intent flow
8. Sign in with a second Google account -> verify shared data visibility
