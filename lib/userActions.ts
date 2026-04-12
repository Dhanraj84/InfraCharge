import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

/**
 * Synchronizes a user profile and their selected vehicle to Firestore.
 * Handles bi-directional sync: pushes local vehicle to cloud, or pulls cloud vehicle to local.
 */
export async function syncUserToFirestore(user: User) {
  if (!user) {
    console.warn("Sync: No user provided to syncUserToFirestore.");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    console.log(`Sync: Starting sync for user ${user.uid}...`);
    
    // 1. Get current local vehicle
    const localVehicleStr = typeof window !== "undefined" ? localStorage.getItem("confirmedVehicle") : null;
    const localVehicle = localVehicleStr ? JSON.parse(localVehicleStr) : null;

    if (localVehicle) {
      console.log("Sync: Found local vehicle in localStorage:", localVehicle.name);
    } else {
      console.log("Sync: No local vehicle found in localStorage.");
    }

    // 2. Prepare update data
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

    // 3. Write to Firestore
    console.log("Sync: Writing profile to Firestore...");
    await setDoc(userRef, updateData, { merge: true });
    console.log("Sync: Firestore write successful.");

    // 4. Pull from Firestore if local is empty (for new device/login)
    if (!localVehicle) {
      console.log("Sync: Local vehicle is empty, checking cloud for saved vehicle...");
      const docSnap = await getDoc(userRef);
      if (docSnap.exists() && docSnap.data().selectedVehicle) {
        const cloudVehicle = docSnap.data().selectedVehicle;
        localStorage.setItem("confirmedVehicle", JSON.stringify(cloudVehicle));
        console.log("Sync: Successfully pulled vehicle from cloud:", cloudVehicle.name);
        
        // Trigger a page reload to update UI if necessary (optional)
        // window.location.reload(); 
      } else {
        console.log("Sync: No vehicle found in cloud profile either.");
      }
    }
    
    console.log(`Sync: Full sync cycle completed for ${user.uid}.`);
  } catch (error) {
    console.error("Sync Error: Failed to synchronize user data:", error);
  }
}
