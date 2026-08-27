import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Generates a shop code guaranteed not to collide with an existing shop.
 * Retries up to 5 times before giving up (collision odds are astronomically
 * low per attempt, so 5 retries is a generous safety margin, not a real limit).
 */
export async function generateUniqueShopCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const snap = await getDoc(doc(db, "shops", code));
    if (!snap.exists()) return code;
  }
  throw new Error("Could not generate a unique shop code. Please try again.");
}
