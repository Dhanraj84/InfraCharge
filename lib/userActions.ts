import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

/**
 * Synchronizes a user profile to the Firestore 'users' collection.
 * Uses setDoc with merge: true to update fields without overwriting everything.
 */
export async function syncUserToFirestore(user: User) {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "New User",
      photoURL: user.photoURL || null,
      lastLogin: serverTimestamp(),
      // We don't set createdAt here to avoid overwriting it.
      // If we wanted to set it once, we could use a batch or check existence first.
    }, { merge: true });
    
    console.log(`User ${user.uid} synced to Firestore successfully.`);
  } catch (error) {
    console.error("Error syncing user to Firestore:", error);
  }
}
