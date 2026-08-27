import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

/**
 * @param {string} collectionName
 * @param {import("firebase/firestore").QueryConstraint[]} [constraints]
 * @param {any[]} [constraintDeps] - Plain values (not QueryConstraint objects)
 *   that determine when the query should actually re-subscribe, e.g. a status
 *   filter or date range picked in the UI. Pass the primitive values that
 *   your constraints were built from — NOT the constraints array itself,
 *   since QueryConstraint objects are a new reference every render and would
 *   cause an infinite re-subscribe loop if used directly as a dep.
 *   Example: useCollection("repairs", [where("status", "==", statusFilter)], [statusFilter])
 */
export function useCollection(collectionName, constraints = [], constraintDeps = []) {
  const { userProfile } = useAuth();
  const shopId = userProfile?.shopId;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use a ref to stabilize the constraints array reference.
  // Without this, passing inline constraints like [orderBy(...)] would cause
  // the effect to re-run on every render, creating infinite subscription loops.
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  useEffect(() => {
    if (!shopId) {
      setData([]);
      setLoading(false);
      setError(new Error("Shop ID is missing or profile is incomplete."));
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "shops", shopId, collectionName),
      ...constraintsRef.current
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore [${collectionName}] error:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
    // Re-subscribe when shopId, the collection, OR any caller-declared
    // constraint dependency changes. constraintDeps is spread so callers can
    // pass however many primitive values their filters depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, shopId, ...constraintDeps]);

  const add = async (data) => {
    if (!shopId) throw new Error("Shop ID missing");
    return addDoc(collection(db, "shops", shopId, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
    });
  };

  const update = async (id, data) => {
    if (!shopId) throw new Error("Shop ID missing");
    return updateDoc(doc(db, "shops", shopId, collectionName, id), data);
  };

  const remove = async (id) => {
    if (!shopId) throw new Error("Shop ID missing");
    return deleteDoc(doc(db, "shops", shopId, collectionName, id));
  };

  return { data, loading, error, add, update, remove };
}
