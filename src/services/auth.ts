import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: "668872511650-j52qdi58lhrav42a54bdpnda6j0llsvn.apps.googleusercontent.com",
  offlineAccess: true,
});

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!response.data?.idToken) {
    throw new Error("No ID token returned from Google Sign-In");
  }
  const credential = auth.GoogleAuthProvider.credential(response.data.idToken);
  return auth().signInWithCredential(credential);
}

export async function signOut() {
  await GoogleSignin.revokeAccess().catch(() => {});
  await auth().signOut();
}
