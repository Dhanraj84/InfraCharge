import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

/**
 * Synchronizes a user profile and their selected vehicle to Firestore.
 * Handles bi-directional sync: pushes local vehicle to cloud, or pulls cloud vehicle to local.
 */
export async function syncUserToFirestore(user: User) {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    
    // 1. Get current local vehicle
    const localVehicleStr = typeof window !== "undefined" ? localStorage.getItem("confirmedVehicle") : null;
    const localVehicle = localVehicleStr ? JSON.parse(localVehicleStr) : null;

    // 2. Update Firestore with user info and local vehicle (if exists)
    const updateData: any = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "New User",
      photoURL: user.photoURL || null,
      lastLogin: serverTimestamp(),
    };

    if (localVehicle) {
      updateData.selectedVehicle = localVehicle;
    }

    await setDoc(userRef, updateData, { merge: true });

    // 3. Pull from Firestore if local is empty (for new device/login)
    if (!localVehicle) {
      const { getDoc } = await import("firebase/firestore");
      const docSnap = await getDoc(userRef);
      if (docSnap.exists() && docSnap.data().selectedVehicle) {
        localStorage.setItem("confirmedVehicle", JSON.stringify(docSnap.data().selectedVehicle));
        console.log("Vehicle pulled from Firestore to localStorage.");
      }
    }
    
    console.log(`User ${user.uid} profile & vehicle synced successfully.`);
  } catch (error) {
    console.error("Error syncing user to Firestore:", error);
  }
}
