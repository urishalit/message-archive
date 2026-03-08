import { router } from "expo-router";

// This file is called by expo-share-intent when the app receives a share intent,
// and by expo-router for deep links.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes("share-intent")) {
    return "/import";
  }
  // Handle https://messages-archive.web.app/conversation/ID deep links
  const webMatch = path.match(/messages-archive\.web\.app\/conversation\/([^/?]+)/);
  if (webMatch) {
    return `/conversation/${webMatch[1]}`;
  }
  return path;
}
