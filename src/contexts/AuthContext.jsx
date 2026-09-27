import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { generateUniqueShopCode } from "../utils/shopCode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cancel any previous profile listener
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setProfileError(null);

        // Step 1: One-time fetch to load profile immediately
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setUserProfile(snap.data());
            setProfileError(null);
          } else {
            // Document does not exist in Firestore at all
            setProfileError(`No user document found for uid: ${firebaseUser.uid}`);
          }
        } catch (err) {
          setProfileError(`getDoc failed: ${err.code} – ${err.message}`);
          console.error("Initial profile fetch failed:", err);
        }

        // Step 2: Real-time listener for role changes
        profileUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data());
              setProfileError(null);
            } else {
              setUserProfile(null);
              setProfileError(`User document missing for uid: ${firebaseUser.uid}`);
            }
            setLoading(false);
          },
          (err) => {
            setProfileError(`onSnapshot failed: ${err.code} – ${err.message}`);
            console.error("Profile listener error:", err.code, err.message);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const registerOwner = async (email, password, name, shopName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Generate a collision-safe 6-character alphanumeric shop code
    const shopId = await generateUniqueShopCode();
    await setDoc(doc(db, "shops", shopId), { name: shopName, ownerId: cred.user.uid, createdAt: new Date() });
    await setDoc(doc(db, "users", cred.user.uid), { name, role: "owner", shopId, email });
    return cred;
  };

  const registerStaff = async (email, password, name, shopId) => {
    const id = shopId.trim().toUpperCase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      const shopSnap = await getDoc(doc(db, "shops", id));
      if (!shopSnap.exists()) {
        // Roll back the auth account so we don't leave an orphaned login
        // with no way to ever get approved.
        await cred.user.delete();
        throw new Error("Shop code not found. Please double-check the code with your shop owner.");
      }
      await setDoc(doc(db, "users", cred.user.uid), { name, role: "pending", shopId: id, email });
      return cred;
    } catch (err) {
      // If cred.user.delete() itself fails (e.g. requires-recent-login edge
      // case), surface the original error anyway rather than a confusing
      // secondary one — the account rollback failure is logged, not shown.
      if (err.code && err.code !== "auth/requires-recent-login") {
        console.error("Failed to roll back orphaned staff account:", err);
      }
      throw err;
    }
  };

  const logout = () => signOut(auth);

  const isOwner = userProfile?.role === "owner";

  return (
    <AuthContext.Provider value={{ user, userProfile, profileError, loading, login, registerOwner, registerStaff, resetPassword, logout, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
