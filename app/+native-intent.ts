import { router } from "expo-router";

// This file is called by expo-share-intent when the app receives a share intent.
// It redirects to the import screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (path.includes("share-intent")) {
    return "/import";
  }
  return path;
}
