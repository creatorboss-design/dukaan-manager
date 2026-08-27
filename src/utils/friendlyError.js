const MESSAGES = {
  "permission-denied": "You don't have permission to do that.",
  "not-found": "That item couldn't be found — it may have been deleted.",
  "unavailable": "Connection issue — please check your internet and try again.",
  "auth/wrong-password": "Incorrect password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-credential": "Incorrect email or password.",
};

/**
 * Converts a raw Firebase/JS error into a user-facing message.
 * Falls back to err.message for errors we've thrown ourselves (which
 * already have readable text) or anything not in the map above.
 * @param {Error & { code?: string }} err
 * @returns {string}
 */
export function friendlyError(err) {
  // Firebase error codes look like "auth/wrong-password" or "permission-denied"
  return (
    MESSAGES[err?.code] ||
    MESSAGES[err?.code?.replace("auth/", "").replace("firestore/", "")] ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}
